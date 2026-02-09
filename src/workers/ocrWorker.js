const { Worker } = require('bullmq');
const path = require('path');
const { connection } = require('../config/redis');
const { handleFileProcessing } = require('../services/OcrService');
const line = require('@line/bot-sdk');

const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const lineClient = new line.Client(lineConfig);


/**
 * Initialize the OCR Worker
 * @param {Object} io - Socket.io instance for real-time updates
 */
function initOcrWorker(io) {
    const worker = new Worker('ocr-processing', async (job) => {
        const { file, userId, source } = job.data;

        console.log(`[Worker] Processing job ${job.id} for user ${userId}: ${file.originalname}`);

        try {
            // Process the file using existing logic
            const result = await handleFileProcessing(file, userId, source);

            // Send real-time update via Socket.io
            if (io) {
                io.emit('new_upload', {
                    count: 1,
                    results: [{
                        type: result.type,
                        amount: result.amount,
                        sender: result.sName || result.storeName || 'ไม่ระบุ',
                        receiver: result.rName || 'ไม่ระบุ',
                        status: result.status,
                        jobId: job.id
                    }]
                });

                // Specific update for the user
                io.emit(`upload_complete_${userId}`, {
                    success: true,
                    result
                });
            }

            // Specific update for LINE user
            const { lineUserId } = job.data;
            if (lineUserId) {
                let replyText = '';
                if (result.type === 'BANK_SLIP') {
                    if (result.status === 'duplicate') {
                        replyText = `⚠️ ตรวจพบสลิปซ้ำ!\n🔢 เลขที่รายการ: ${result.transId}\nสลิปนี้เคยมีการบันทึกในระบบแล้วครับ`;
                    } else if (result.status === 'invalid_receiver') {
                        replyText = `❌ ตรวจสอบผู้รับโอนไม่สำเร็จ\n${result.message || 'ข้อมูลผู้รับโอนไม่ตรงกับที่ตั้งค่าไว้'}`;
                    } else if (result.status === 'warning') {
                        replyText = `🚫 ตรวจพบสลิปที่อาจมีความผิดปกติ!\nกรุณาตรวจสอบความถูกต้องของสลิปนี้อีกครั้งเพื่อป้องกันการทุจริต`;
                    } else {
                        replyText = `✅ บันทึกสลิปสำเร็จ\n💰 ยอดเงิน: ${result.amount} บาท\n👤 จาก: ${result.sName}\n➡️ ถึง: ${result.rName}`;
                    }
                } else {
                    replyText = `✅ บันทึกใบเสร็จสำเร็จ\n💰 ยอดเงิน: ${result.amount} บาท\n🏢 ร้าน: ${result.storeName || 'ไม่ระบุ'}`;
                }

                try {
                    await lineClient.pushMessage(lineUserId, { type: 'text', text: replyText });
                } catch (lineErr) {
                    console.error('[Worker] Failed to push LINE message:', lineErr.message);
                }
            }

            return result;

        } catch (error) {
            console.error(`[Worker] Job ${job.id} failed:`, error.message);

            if (io) {
                io.emit(`upload_complete_${userId}`, {
                    success: false,
                    fileName: file.originalname,
                    error: error.message
                });
            }

            const { lineUserId } = job.data;
            if (lineUserId) {
                try {
                    await lineClient.pushMessage(lineUserId, {
                        type: 'text',
                        text: `❌ เกิดข้อผิดพลาดในการประมวลผลไฟล์ ${file.originalname}: ${error.message}`
                    });
                } catch (lineErr) {
                    console.error('[Worker] Failed to push LINE error message:', lineErr.message);
                }
            }

            throw error; // Re-throw to let BullMQ handle retries

        }
    }, { connection });

    worker.on('completed', (job) => {
        console.log(`[Worker] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job.id} failed with error: ${err.message}`);
    });

    return worker;
}

module.exports = { initOcrWorker };
