const IORedis = require('ioredis');

// BullMQ requires maxRetriesPerRequest: null on its connections.
module.exports = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
