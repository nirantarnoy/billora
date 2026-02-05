const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { readBillText, readBillTextPython } = require('./vision');
const { parseThaiSlip, parseReceipt, checkForgeryScore } = require('./parser');
const { analyzeWithGemini } = require('./GeminiService');
const { recordAction } = require('../utils/logger');

async function handleFileProcessing(file, userId, source = 'BROWSER', req = null) {
    const filePath = file.path;
    const absolutePath = path.resolve(filePath);

    // Get User Plan Features and Tenant ID
    let useAI = false;
    let tenantId = null;
    try {
        const [userRows] = await db.execute(`
            SELECT u.tenant_id, p.features 
            FROM users u 
            LEFT JOIN tenants t ON u.tenant_id = t.id 
            LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id AND ts.status = 'active'
            LEFT JOIN subscription_plans p ON ts.plan_id = p.id 
            WHERE u.id = ?
            ORDER BY ts.created_at DESC
            LIMIT 1
        `, [userId]);

        if (userRows.length > 0) {
            tenantId = userRows[0].tenant_id;
            const features = typeof userRows[0].features === 'string' ? JSON.parse(userRows[0].features) : userRows[0].features;
            useAI = features && (features.ai_audit === true || features.ai_audit === 'true');
            console.log(`[OCR] User ID: ${userId}, Plan AI Audit Feature: ${useAI}`);
        }
    } catch (err) {
        console.warn("Could not determine user plan for AI features:", err.message);
    }

    // 1. OCR Stage
    let rawText = '';
    let aiResult = null;
    const ocrEngine = process.env.OCR_ENGINE || 'VISION';

    // If AI is enabled, try Gemini first
    if (useAI && process.env.GEMINI_API_KEY) {
        try {
            console.log(`[AI] Processing with Gemini: ${filePath}`);
            aiResult = await analyzeWithGemini(absolutePath);
            if (aiResult) {
                rawText = aiResult.raw_text || '';
            }
        } catch (err) {
            console.error("Gemini AI Processing Failed, falling back to standard OCR:", err.message);
        }
    }

    // Standard OCR if rawText is still empty (Gemini failed or AI disabled)
    if (!rawText) {
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
    }

    // Determine type (Use Gemini result if available, else regex)
    const type = aiResult ? aiResult.type : null;

    // 2. Identification logic
    const slipKeywords = [
        'โอนเงินสำเร็จ', 'รายการสำเร็จ', 'โอนเงินแล้ว', 'สำเร็จ',
        'Successful', 'Transfer Successful', 'Payment Success',
        'เลขที่อ้างอิง', 'รหัสรายการ', 'สลิป', 'PromptPay', 'โอนเข้า', 'บันทึกช่วยจำ', 'จาก', 'ไปยัง'
    ];

    const isSlip = type === 'BANK_SLIP' || (!type && (
        slipKeywords.some(keyword => new RegExp(keyword, 'i').test(rawText)) ||
        /ref\.?\s*no/i.test(rawText) ||
        /transaction\s*id/i.test(rawText) ||
        /บันทึกช่วยจำ/i.test(rawText)
    ));

    if (isSlip) {
        // --- SLIP PROCESSING ---
        const slipData = aiResult && aiResult.data ? {
            trans_id: aiResult.data.trans_id,
            amount: aiResult.data.amount,
            sender: aiResult.data.sender ? aiResult.data.sender.name : 'ไม่ระบุ',
            receiver: aiResult.data.receiver ? aiResult.data.receiver.name : 'ไม่ระบุ',
            datetime: aiResult.data.datetime
        } : parseThaiSlip(rawText);

        const forgeryResult = aiResult && aiResult.audit_result ? {
            score: aiResult.confidence_score * 100,
            isSuspicious: aiResult.audit_result.forgery_detected,
            reasons: [aiResult.audit_result.forgery_reason || aiResult.audit_result.audit_remark].filter(Boolean)
        } : checkForgeryScore(rawText, slipData);

        const transId = slipData.trans_id || `TEMP_${Date.now()}`;
        const amount = slipData.amount || 0;

        let status = forgeryResult.isSuspicious ? 'warning' : 'success';

        // Bank Detection (Enhanced with AI if available)
        let sBank = aiResult && aiResult.data && aiResult.data.sender ? aiResult.data.sender.bank : null;
        let rBank = aiResult && aiResult.data && aiResult.data.receiver ? aiResult.data.receiver.bank : null;

        if (!sBank || !rBank) {
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
            const sName = slipData.sender;
            const rName = slipData.receiver;

            const sIdx = docLines.findIndex(l => l.includes(sName) || /จาก|ผู้โอน|From/i.test(l));
            const rIdx = docLines.findIndex(l => l.includes(rName) || /ไปยัง|ผู้รับ|To/i.test(l));

            if (!sBank) sBank = findBank(docLines.slice(Math.max(0, sIdx - 1), sIdx + 3).join(' '));
            if (!rBank) rBank = findBank(docLines.slice(Math.max(0, rIdx - 1), rIdx + 3).join(' '));
        }

        // Duplicate Check
        const [duplicates] = await db.execute(`SELECT id FROM payment_slips WHERE trans_id = ?`, [transId]);
        if (duplicates.length > 0) {
            await db.execute(
                `INSERT INTO ocr_logs (user_id, tenant_id, type, source, status, amount, trans_id, image_path, ai_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, tenantId, 'BANK_SLIP', source, 'duplicate', amount, transId, filePath, !!aiResult]
            );
            return { type: 'BANK_SLIP', transId, sName: slipData.sender, rName: slipData.receiver, amount, status: 'duplicate', source };
        }

        await db.execute(
            `INSERT INTO payment_slips (user_id, tenant_id, company_id, trans_id, sender_name, sender_bank, receiver_name, receiver_bank, amount, datetime, status, raw_text, image_path, source, forgery_score, forgery_reasons, ai_audit_result)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, tenantId, tenantId, transId, slipData.sender, sBank, slipData.receiver, rBank, amount, slipData.datetime || new Date(), status, rawText, filePath, source, forgeryResult.score, JSON.stringify(forgeryResult.reasons), aiResult ? JSON.stringify(aiResult) : null]
        );

        await db.execute(
            `INSERT INTO ocr_logs (user_id, tenant_id, type, source, status, amount, trans_id, image_path, ai_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, tenantId, 'BANK_SLIP', source, status, amount, transId, filePath, !!aiResult]
        );

        return { type: 'BANK_SLIP', transId, sName: slipData.sender, rName: slipData.receiver, amount, status, source, ai_audited: !!aiResult };
    } else {
        // --- RECEIPT PROCESSING ---
        const receiptData = aiResult && aiResult.data ? {
            storeName: aiResult.data.vendor ? aiResult.data.vendor.name : 'ไม่ระบุ',
            date: aiResult.data.datetime ? new Date(aiResult.data.datetime) : new Date(),
            amount: aiResult.data.total || aiResult.data.amount || 0,
            vat: aiResult.data.vat || 0,
            items: aiResult.data.items || []
        } : parseReceipt(rawText);

        const [billResult] = await db.execute(
            `INSERT INTO bills (user_id, tenant_id, company_id, store_name, date, total_amount, vat, items, raw_text, image_path, source, ai_audit_result)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, tenantId, tenantId, receiptData.storeName, receiptData.date, receiptData.amount, receiptData.vat, JSON.stringify(receiptData.items), rawText, filePath, source, aiResult ? JSON.stringify(aiResult) : null]
        );

        await db.execute(
            `INSERT INTO ocr_logs (user_id, tenant_id, type, source, status, amount, image_path, ai_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, tenantId, 'RECEIPT', source, 'success', receiptData.amount, filePath, !!aiResult]
        );

        return { type: 'RECEIPT', id: billResult.insertId, amount: receiptData.amount, storeName: receiptData.storeName, status: 'success', source, ai_audited: !!aiResult };
    }
}

module.exports = { handleFileProcessing };
