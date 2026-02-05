const { Queue } = require('bullmq');
const { connection } = require('../config/redis');

const ocrQueue = new Queue('ocr-processing', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    }
});

module.exports = ocrQueue;
