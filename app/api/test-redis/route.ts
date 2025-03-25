import { type NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check if we have Redis credentials for logging
    const restApiUrl =
      process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const restApiToken =
      process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!restApiUrl || !restApiToken) {
      console.error('Missing Redis credentials:', {
        hasUrl: !!restApiUrl,
        hasToken: !!restApiToken,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            'Redis credentials are not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN environment variables.',
        },
        { status: 500 },
      );
    }

    console.log('Using Redis URL:', `${restApiUrl.substring(0, 20)}...`);
    console.log('Auth token present:', !!restApiToken);

    // Create a Redis client
    const redis = new Redis({
      url: restApiUrl,
      token: restApiToken,
    });

    // Test Redis connection by setting and retrieving a value
    const testKey = 'mcp-test-key';
    const testValue = `MCP Redis is working! ${new Date().toISOString()}`;

    console.log('Attempting to set Redis key...');
    await redis.set(testKey, testValue);
    console.log('Successfully set Redis key');

    console.log('Attempting to get Redis key...');
    const value = await redis.get(testKey);
    console.log('Successfully retrieved Redis key');

    return NextResponse.json({
      success: true,
      message: 'Redis connection successful',
      value,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Redis test error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to connect to Redis',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
