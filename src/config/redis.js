const IORedis = require('ioredis');

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null, // Required for BullMQ
};

const connection = new IORedis(redisConfig);

let isRedisOffline = false;

connection.on('error', (err) => {
    if (!isRedisOffline) {
        console.warn('⚠️ Redis is offline. System will fallback to synchronous processing.');
        isRedisOffline = true;
    }
});

connection.on('connect', () => {
    console.log('✓ Connected to Redis');
    isRedisOffline = false;
});

module.exports = {
    connection,
    redisConfig,
    getIsRedisOffline: () => isRedisOffline
};

