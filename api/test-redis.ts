import { Redis } from '@upstash/redis';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Check if we have Redis credentials
    const restApiUrl =
      process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const restApiToken =
      process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!restApiUrl || !restApiToken) {
      return res.status(500).json({
        success: false,
        error:
          'Redis credentials are not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN environment variables.',
      });
    }

    // Create a Redis client using the provided credentials
    const redis = new Redis({
      url: restApiUrl,
      token: restApiToken,
    });

    // Test Redis connection by setting and retrieving a value
    const testKey = 'mcp-test-key';
    const testValue = `MCP Redis is working! ${new Date().toISOString()}`;

    await redis.set(testKey, testValue);
    const value = await redis.get(testKey);

    return res.status(200).json({
      success: true,
      message: 'Redis connection successful',
      value,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Redis test error:', error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to connect to Redis',
    });
  }
}
