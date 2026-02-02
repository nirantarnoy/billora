const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { readBillText, readBillTextPython } = require('./vision');
const { parseThaiSlip, parseReceipt, checkForgeryScore } = require('./parser');
const { recordAction } = require('../utils/logger');

async function handleFileProcessing(file, userId, source = 'BROWSER', req = null) {
    const filePath = file.path;

    // 1. OCR Stage
    let rawText = '';
    const ocrEngine = process.env.OCR_ENGINE || 'VISION';

    try {
        if (ocrEngine === 'PYTHON') {
            rawText = await readBillTextPython(filePath);
        } else {
            rawText = await readBillText(filePath);
        }
        if (!rawText) throw new Error("Could not extract any text from image");
    } catch (err) {
        console.error(`${ocrEngine} OCR Error:`, err.message);
        throw new Error(`ไม่สามารถอ่านข้อความจากรูปภาพได้ (${ocrEngine})`);
    }

    // 2. Simple Extraction Logic (Regex)
    const amountRegex = /([0-9,]+\.[0-9]{2})/g;
    const amounts = rawText.match(amountRegex) || [];
    const maxAmount = amounts.length ? Math.max(...amounts.map(a => parseFloat(a.replace(/,/g, '')))) : 0;

    const slipKeywords = [
        'โอนเงินสำเร็จ', 'รายการสำเร็จ', 'โอนเงินแล้ว', 'สำเร็จ',
        'Successful', 'Transfer Successful', 'Payment Success',
        'เลขที่อ้างอิง', 'รหัสรายการ', 'สลิป', 'PromptPay', 'โอนเข้า', 'บันทึกช่วยจำ', 'จาก', 'ไปยัง'
    ];

    const isSlip = slipKeywords.some(keyword => new RegExp(keyword, 'i').test(rawText)) ||
        /ref\.?\s*no/i.test(rawText) ||
        /transaction\s*id/i.test(rawText) ||
        /บันทึกช่วยจำ/i.test(rawText);

    if (isSlip) {
        const slipData = parseThaiSlip(rawText);
        const forgeryResult = checkForgeryScore(rawText, slipData);

        const transId = slipData.trans_id || `TEMP_${Date.now()}`;
        const amount = slipData.amount || maxAmount;

        let status = forgeryResult.isSuspicious ? 'warning' : 'success';

        const banks = [
            { name: 'กสิกรไทย', keywords: ['กสิกร', 'Kasikorn', 'K-Bank', 'KBANK'] },
            { name: 'ไทยพาณิชย์', keywords: ['ไทยพาณิชย์', 'SCB', 'Siam Commercial'] },
            { name: 'กรุงเทพ', keywords: ['กรุงเทพ', 'Bangkok Bank', 'BBL'] },
            { name: 'กรุงไทย', keywords: ['กรุงไทย', 'Krung Thai', 'KTB'] },
            { name: 'กรุงศรี', keywords: ['กรุงศรี', 'Krungsri', 'BAY'] },
            { name: 'ทหารไทยธนชาต', keywords: ['ทหารไทย', 'ธนชาต', 'ttb'] },
            { name: 'ออมสิน', keywords: ['ออมสิน', 'GSB'] },
            { name: 'ธ.ก.ส.', keywords: ['ธ.ก.ส.', 'BAAC'] },
            { name: 'ยูโอบี', keywords: ['ยูโอบี', 'UOB'] },
            { name: 'CIMB', keywords: ['CIMB'] }
        ];

        const findBank = (snippet) => {
            for (const bank of banks) {
                if (bank.keywords.some(k => new RegExp(k, 'i').test(snippet))) return bank.name;
            }
            return 'ไม่ระบุ';
        };

        const docLines = rawText.split('\n');
        let sName = slipData.sender;
        let rName = slipData.receiver;

        const sIdx = docLines.findIndex(l => l.includes(sName) || /จาก|ผู้โอน|From/i.test(l));
        const rIdx = docLines.findIndex(l => l.includes(rName) || /ไปยัง|ผู้รับ|To/i.test(l));

        const sBank = findBank(docLines.slice(Math.max(0, sIdx - 1), sIdx + 3).join(' '));
        const rBank = findBank(docLines.slice(Math.max(0, rIdx - 1), rIdx + 3).join(' '));

        // Duplicate Check
        const [duplicates] = await db.execute(`SELECT id FROM payment_slips WHERE trans_id = ?`, [transId]);
        if (duplicates.length > 0) {
            await db.execute(
                `INSERT INTO ocr_logs (user_id, type, source, status, amount, trans_id, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, 'BANK_SLIP', source, 'duplicate', amount, transId, filePath]
            );
            await recordAction(userId, 'Upload Duplicate Slip', `พยายามอัปโหลดสลิปซ้ำ (เลขที่: ${transId})`, req);
            return { type: 'BANK_SLIP', transId, sName, rName, amount, status: 'duplicate', source };
        }

        await db.execute(
            `INSERT INTO payment_slips (user_id, trans_id, sender_name, sender_bank, receiver_name, receiver_bank, amount, datetime, status, raw_text, image_path, source, forgery_score, forgery_reasons)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, transId, sName, sBank, rName, rBank, amount, new Date(), status, rawText, filePath, source, forgeryResult.score, JSON.stringify(forgeryResult.reasons)]
        );

        await db.execute(
            `INSERT INTO ocr_logs (user_id, type, source, status, amount, trans_id, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, 'BANK_SLIP', source, status, amount, transId, filePath]
        );

        const actionLabel = forgeryResult.isSuspicious ? 'Upload Suspicious Slip' : 'Upload Bank Slip';
        const actionDetail = forgeryResult.isSuspicious
            ? `อัปโหลดสลิปต้องสงสัย (Score: ${forgeryResult.score}) ยอด ${amount} บาท`
            : `อัปโหลดสลิปเงินโอน ยอด ${amount} บาท (จาก: ${sName})`;
        await recordAction(userId, actionLabel, actionDetail, req);

        return { type: 'BANK_SLIP', transId, sName, rName, amount, status, source };
    } else {
        const receiptData = parseReceipt(rawText);

        const [billResult] = await db.execute(
            `INSERT INTO bills (user_id, store_name, date, total_amount, vat, items, raw_text, image_path, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, receiptData.storeName, receiptData.date, receiptData.amount, receiptData.vat, JSON.stringify(receiptData.items), rawText, filePath, source]
        );

        await db.execute(
            `INSERT INTO ocr_logs (user_id, type, source, status, amount, image_path) VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, 'RECEIPT', source, 'success', receiptData.amount, filePath]
        );

        await recordAction(userId, 'Upload Receipt', `อัปโหลดใบเสร็จ ยอด ${receiptData.amount} บาท จากร้าน ${receiptData.storeName}`, req);

        return { type: 'RECEIPT', id: billResult.insertId, amount: receiptData.amount, storeName: receiptData.storeName, status: 'success', source };
    }
}

module.exports = { handleFileProcessing };
