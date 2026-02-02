function parseThaiSlip(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // 1. หาจำนวนเงิน (มองหาคำว่า "จำนวน" "บาท" หรือตัวเลข .00)
    // สำหรับสลิป กสิกร มักมีคำว่า บาท ต่อท้ายจำนวนเงิน
    const amountMatch = text.match(/([\d,]+\.\d{2})\s*บาท/i)
        || text.match(/(?:จำนวนเงิน|จำนวน|Amount)[:\s]*([\d,]+\.\d{2})/i)
        || text.match(/([\d,]+\.\d{2})/);

    // 2. หาเลขที่รายการ (Transaction ID)
    const transIdMatch = text.match(/(?:เลขที่รายการ|เลขที่อ้างอิง|รหัสรายการ|Transaction\s*ID|Ref\.?\s*No)[:\s]*([A-Z0-9]{10,})/i)
        || text.match(/([0-9]{10,25}[A-Z0-9]{0,10})/);

    // 3. หาวันที่/เวลา (รองรับ 16 ม.ค. 69 17:25 น. หรือ 16/01/2026)
    const thaiMonths = "(?:ม\\.ค\\.|ก\\.พ\\.|มี\\.ค\\.|เม\\.ย\\.|พ\\.ค\\.|มิ\\.ย\\.|ก\\.ค\\.|ส\\.ค\\.|ก\\.ย\\.|ต\\.ค\\.|พ\\.ย\\.|ธ\\.ค\\.)";
    const dateMatch = text.match(new RegExp(`(\\d{1,2}\\s+${thaiMonths}\\s+\\d{2,4}(?:\\s+\\d{2}:\\d{2})?)`, 'i'))
        || text.match(/(\d{2}\/\d{2}\/\d{4})/);

    // 4. แยกชื่อผู้โอน/ผู้รับ ตามลำดับที่เจอ
    let senderName = 'ไม่ระบุ';
    let receiverName = 'ไม่ระบุ';

    // รายการคำนำหน้าชื่อที่น่าจะเป็นชื่อคนหรือบริษัท
    const namePrefixes = [
        'นาย', 'นางสาว', 'นาง', 'น\\.ส\\.',
        'บริษัท', 'บจก\\.', 'หจก\\.', 'ห้างหุ้นส่วน',
        'Mr\\.', 'Mrs\\.', 'Ms\\.'
    ];

    const namePattern = new RegExp(`(?:${namePrefixes.join('|')})\\s*[^\nธ]+`, 'g');
    const nameMatches = text.match(namePattern);

    if (nameMatches) {
        // กรองคำซ้ำหรือคำที่สั้นเกินไป (เช่น "นาย " เฉยๆ)
        const cleanNames = nameMatches
            .map(n => n.trim())
            .filter(n => n.length > 5);

        if (cleanNames.length >= 1) senderName = cleanNames[0];
        if (cleanNames.length >= 2) receiverName = cleanNames[1];
    }

    // กรณีพิเศษ: ถ้าเจอคำว่า "จาก" หรือ "ไปยัง" ให้ใช้ตำแหน่งนั้นช่วยยืนยัน
    const fromLineIdx = lines.findIndex(l => /จาก|ผู้โอน|From/i.test(l));
    const toLineIdx = lines.findIndex(l => /ไปยัง|ผู้รับ|To/i.test(l));

    if (fromLineIdx !== -1 && lines[fromLineIdx + 1] && senderName === 'ไม่ระบุ') {
        senderName = lines[fromLineIdx + 1];
    }
    if (toLineIdx !== -1 && lines[toLineIdx + 1] && receiverName === 'ไม่ระบุ') {
        receiverName = lines[toLineIdx + 1];
    }

    return {
        success: !!(amountMatch || transIdMatch),
        trans_id: transIdMatch ? (transIdMatch[1] || transIdMatch[0]) : '',
        amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0,
        date: dateMatch ? dateMatch[1] : '',
        sender: senderName,
        receiver: receiverName,
        raw_text: text
    };
}

function parseReceipt(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // 1. หาชื่อร้าน
    let storeName = 'ร้านค้า (ไม่ระบุ)';
    if (lines.length > 0) {
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            if (lines[i].length > 4 &&
                !/^[\d\W]+$/.test(lines[i]) &&
                !/ใบกำกับภาษี|TAX INVOICE|ABB|ใบเสร็จ|RECEIPT/i.test(lines[i])) {
                storeName = lines[i];
                break;
            }
        }
    }

    // 2. ค้นหายอดรวม (ลำดับความสำคัญ: ยอดสุทธิ > Total > รวมทั้งสิ้น)
    const grandTotalRegex = /(?:ยอดสุทธิ|Grand\s*Total|Total\s*Amount|Net\s*Amount|Amount\s*Due|ยอดชำระ|ชำระทั้งสิ้น)[:\s]*([\d,]+\.\d{2})/i;
    const commonTotalRegex = /(?:Total|Net|รวมทั้งสิ้น|ยอดรวม|รวม)[:\s]*([\d,]+\.\d{2})/i;

    let amount = 0;
    const gtMatch = text.match(grandTotalRegex);

    if (gtMatch) {
        amount = parseFloat(gtMatch[1].replace(/,/g, ''));
    } else {
        const allMatches = text.match(new RegExp(commonTotalRegex.source, 'gi'));
        if (allMatches) {
            const lastMatch = allMatches[allMatches.length - 1];
            const val = lastMatch.match(/[\d,]+\.\d{2}/);
            if (val) amount = parseFloat(val[0].replace(/,/g, ''));
        }
    }

    if (amount === 0) {
        const amounts = text.match(/([\d,]+\.\d{2})/g);
        if (amounts) {
            amount = Math.max(...amounts.map(a => parseFloat(a.replace(/,/g, ''))));
        }
    }

    // 3. หา VAT (ภาษีมูลค่าเพิ่ม) - ปรับปรุงให้ยืดหยุ่นขึ้น
    const vatRegex = /(?:VAT|ภาษีมูลค่าเพิ่ม|ภาษี|Vat)\s*(?:7\s*%)?[\s:]*([\d,]+\.\d{2})/i;
    const vatMatch = text.match(vatRegex);
    let vat = 0;
    if (vatMatch) {
        vat = parseFloat(vatMatch[1].replace(/,/g, ''));
    }

    // 4. หาวันที่ (DD/MM/YYYY หรือ DD-MM-YYYY)
    const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
        || text.match(/(\d{1,2})\s+(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s+(\d{2,4})/);

    let date = new Date().toISOString().split('T')[0];
    if (dateMatch) {
        try {
            let day = dateMatch[1];
            let month = dateMatch[2];
            let year = dateMatch[3];
            if (parseInt(year) > 2500) year = (parseInt(year) - 543).toString();
            else if (parseInt(year) < 100) year = (2000 + parseInt(year)).toString();
            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            if (isNaN(month)) month = (thaiMonths.indexOf(month) + 1).toString();
            date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        } catch (e) { }
    }

    // 5. แกะรายการสินค้า
    const items = [];
    lines.forEach(line => {
        const priceMatch = line.match(/(-?\s*[\d,]+\.\d{2})\s*[B฿]?$/i);
        if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(/[\s,]/g, ''));
            // กรองยอดรวมและภาษีออก (ใช้ delta 0.1 เพื่อเลี่ยงปัญหา float)
            if (price > 0 && Math.abs(price - amount) > 0.1 && Math.abs(price - vat) > 0.1 && items.length < 20) {
                const name = line.replace(priceMatch[0], '').trim();
                if (name.length > 2 && !/Total|รวม|ภาษี|VAT/i.test(name)) {
                    items.push({ name, price });
                }
            }
        }
    });

    return {
        storeName,
        amount,
        vat,
        date,
        items,
        rawText: text
    };
}

function checkForgeryScore(text, parsedData) {
    let score = 0; // 0-100, higher is more suspicious
    let reasons = [];

    // 1. Missing Critical Data
    if (!parsedData.trans_id) {
        score += 40;
        reasons.push("ไม่พบเลขที่รายการ");
    }
    if (parsedData.amount <= 0) {
        score += 30;
        reasons.push("ไม่พบยอดเงินหรือยอดเงินไม่ถูกต้อง");
    }

    // 2. Suspicious Keywords (Simulation/Testing/Samples)
    const fakeKeywords = [/ตัวอย่าง/i, /จำลอง/i, /ทดสอบ/i, /test/i, /sample/i, /demo/i, /ซ้อม/i];
    fakeKeywords.forEach(regex => {
        if (regex.test(text)) {
            score += 50;
            reasons.push(`ตรวจพบคำต้องสงสัย: ${text.match(regex)[0]}`);
        }
    });

    // 3. Metadata/Text Consistency
    // If it mentions "โอนเงินสำเร็จ" but missing bank names
    const successKeywords = [/โอนเงินสำเร็จ/i, /รายการสำเร็จ/i, /Successful/i, /Transfer Successful/i];
    const hasSuccess = successKeywords.some(r => r.test(text));
    if (hasSuccess && (!parsedData.sender || parsedData.sender === 'ไม่ระบุ')) {
        score += 20;
        reasons.push("ข้อความระบุว่าสำเร็จแต่ไม่พบชื่อผู้โอน");
    }

    // 4. Formatting checks (Basic)
    // If multiple decimals found that are very different
    const amountRegex = /([\d,]+\.\d{2})/g;
    const allAmounts = text.match(amountRegex) || [];
    if (allAmounts.length > 5) {
        score += 15;
        reasons.push("พบจำนวนเงินมากผิดปกติในภาพเดียว");
    }

    // 5. Bank Specific Logic (Kasikorn ID format check as example)
    if (text.includes("กสิกร") || text.includes("K-Bank")) {
        // K-Bank usually 01x...
        if (parsedData.trans_id && !/^\d{15,}/.test(parsedData.trans_id) && !parsedData.trans_id.includes("TEMP")) {
            score += 20;
            reasons.push("รูปแบบเลขที่รายการไม่ตรงกับธนาคารกสิกรไทย");
        }
    }

    return {
        score: Math.min(score, 100),
        reasons: reasons,
        isSuspicious: score >= 40
    };
}

module.exports = { parseThaiSlip, parseReceipt, checkForgeryScore };
