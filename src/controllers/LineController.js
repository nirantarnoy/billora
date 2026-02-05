const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const ocrQueue = require('../queues/ocrQueue');
const { getIsRedisOffline } = require('../config/redis');
const { handleFileProcessing } = require('../services/OcrService');



const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YOUR_CHANNEL_ACCESS_TOKEN',
    channelSecret: process.env.LINE_CHANNEL_SECRET || 'YOUR_CHANNEL_SECRET',
};

const lineClient = new line.Client(lineConfig);

async function handleLineEvent(event, io) {
    if (event.type !== 'message' || event.message.type !== 'image') {
        if (event.type === 'message' && event.message.type === 'text') {
            const text = event.message.text.trim();
            if (text.toLowerCase().startsWith('link ')) {
                const username = text.split(' ')[1];
                const lineUserId = event.source.userId;
                try {
                    const [result] = await db.execute('UPDATE users SET line_user_id = ? WHERE username = ?', [lineUserId, username]);
                    if (result.affectedRows > 0) {
                        return lineClient.replyMessage(event.replyToken, { type: 'text', text: `✅ ผูกบัญชีกับผู้ใช้ ${username} สำเร็จ` });
                    } else {
                        return lineClient.replyMessage(event.replyToken, { type: 'text', text: `❌ ไม่พบผู้ใช้ชื่อ ${username}` });
                    }
                } catch (err) {
                    return lineClient.replyMessage(event.replyToken, { type: 'text', text: `❌ เกิดข้อผิดพลาด: ${err.message}` });
                }
            }
        }
        return Promise.resolve(null);
    }

    const { message, source } = event;
    const lineUserId = source.userId;

    const [users] = await db.execute('SELECT id, tenant_id FROM users WHERE line_user_id = ?', [lineUserId]);
    const userData = users.length > 0 ? users[0] : null;
    let userId = userData ? userData.id : null;
    let tenantId = userData ? userData.tenant_id : 1;

    if (!userId) {
        return lineClient.replyMessage(event.replyToken, {
            type: 'text',
            text: '⚠️ กรุณาผูกบัญชี LINE กับระบบก่อนใช้งาน\nพิมพ์: link [ชื่อผู้ใช้]\nตัวอย่าง: link admin'
        });
    }

    try {
        const stream = await lineClient.getMessageContent(message.id);
        const fileName = `line_${message.id}.jpg`;
        const tenantDir = path.join(__dirname, '../../uploads', tenantId.toString());

        if (!fs.existsSync(tenantDir)) {
            fs.mkdirSync(tenantDir, { recursive: true });
        }

        const absolutePath = path.join(tenantDir, fileName);
        const relativePath = `uploads/${tenantId}/${fileName}`;
        const writer = fs.createWriteStream(absolutePath);

        stream.pipe(writer);


        return new Promise((resolve, reject) => {
            writer.on('finish', async () => {
                try {
                    // Fallback: If Redis is offline, process synchronously
                    if (getIsRedisOffline()) {
                        console.log('[LINE] Fallback: Redis is offline, processing in SYNC mode');
                        const result = await handleFileProcessing({ path: relativePath, originalname: fileName }, userId, 'LINE');

                        let replyText = '';
                        if (result.type === 'BANK_SLIP') {
                            if (result.status === 'duplicate') {
                                replyText = `⚠️ ตรวจพบสลิปซ้ำ!\n🔢 เลขที่รายการ: ${result.transId}\nสลิปนี้เคยมีการบันทึกในระบบแล้วครับ`;
                            } else if (result.status === 'warning') {
                                replyText = `🚫 ตรวจพบสลิปที่อาจมีความผิดปกติ!\nกรุณาตรวจสอบความถูกต้องของสลิปนี้อีกครั้งเพื่อป้องกันการทุจริต`;
                            } else {
                                replyText = `✅ บันทึกสลิปสำเร็จ\n💰 ยอดเงิน: ${result.amount} บาท\n👤 จาก: ${result.sName}\n➡️ ถึง: ${result.rName}`;
                            }
                        } else {
                            replyText = `✅ บันทึกใบเสร็จสำเร็จ\n💰 ยอดเงิน: ${result.amount} บาท`;
                        }

                        if (io) {
                            io.emit('new_upload', {
                                count: 1,
                                results: [{
                                    type: result.type,
                                    amount: result.amount,
                                    sender: result.sName || 'ร้านค้า (ไม่ระบุ)',
                                    receiver: result.rName,
                                    status: result.status || 'success'
                                }]
                            });
                        }

                        await lineClient.replyMessage(event.replyToken, { type: 'text', text: replyText });
                        return resolve(result);
                    }

                    // Send initial response
                    await lineClient.replyMessage(event.replyToken, {
                        type: 'text',
                        text: 'คิวได้รับรูปภาพแล้ว กำลังเริ่มวิเคราะห์ข้อมูลด้วย AI สักครู่ครับ... ⏳'
                    });

                    // Add to queue
                    await ocrQueue.add('ocr-job', {
                        file: { path: relativePath, originalname: fileName },
                        userId,
                        lineUserId,
                        source: 'LINE'
                    });

                    resolve(true);
                } catch (err) {
                    console.error('Processing error:', err);
                    resolve(null);
                }
            });


            writer.on('error', reject);
        });

    } catch (err) {
        console.error('LINE Content Error:', err);
        return lineClient.replyMessage(event.replyToken, { type: 'text', text: '❌ ไม่สามารถดาวน์โหลดรูปภาพได้' });
    }
}

module.exports = { handleLineEvent, lineConfig };
