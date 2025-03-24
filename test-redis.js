// Simple script to test Redis connection
require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');

async function testRedisConnection() {
  try {
    // Get Redis credentials from environment variables
    const url =
      process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      console.error('Redis credentials not found in environment variables');
      process.exit(1);
    }

    console.log('Connecting to Redis at:', url);

    // Create Redis client
    const redis = new Redis({
      url,
      token,
    });

    // Test connection
    const testKey = 'mcp-test-key-' + Date.now();
    const testValue = `MCP Redis test at ${new Date().toISOString()}`;

    console.log(`Setting key: ${testKey}`);
    await redis.set(testKey, testValue);

    console.log('Reading key back...');
    const value = await redis.get(testKey);

    console.log('Success! Retrieved value:', value);
    console.log('Redis connection is working correctly!');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
}

// Run the test
testRedisConnection();
