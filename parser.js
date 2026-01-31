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

module.exports = { parseThaiSlip };
