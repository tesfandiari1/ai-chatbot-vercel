// Redis client factory for MCP state management
import { Redis } from '@upstash/redis';

interface RedisClientOptions {
  allowFallback?: boolean;
  retries?: number;
}

/**
 * Creates a Redis client with the specified options
 * @param options Configuration options
 * @returns Redis client or fallback
 */
export function createRedisClient(
  options: RedisClientOptions = {},
): Redis | Record<string, any> {
  const {
    allowFallback = process.env.NODE_ENV === 'development',
    retries = 2,
  } = options;

  // Get Redis URL from environment variables - prioritize REST API URL for Upstash
  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error('Missing Upstash Redis credentials for MCP state management');

    if (allowFallback) {
      console.warn('Creating in-memory fallback for MCP state management');
      return createInMemoryClient();
    }

    throw new Error(
      'Upstash Redis credentials are not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN environment variables.',
    );
  }

  try {
    console.log('Creating Upstash Redis client for MCP state management');
    console.log(`Using Redis endpoint: ${redisUrl}`);

    // Create Redis client with retry options
    return new Redis({
      url: redisUrl,
      token: redisToken,
      retry: {
        retries,
        backoff: (retryCount) => Math.min(retryCount * 500, 2000),
      },
    });
  } catch (error) {
    console.error('Failed to create Redis client:', error);

    if (allowFallback) {
      console.warn('Creating in-memory fallback for MCP state management');
      return createInMemoryClient();
    }

    throw error;
  }
}

/**
 * Creates an in-memory client that implements the Redis interface needed for MCP
 * @returns In-memory client with Redis-like methods
 */
export function createInMemoryClient(): Record<string, any> {
  const store = new Map<string, any>();
  const hashStore = new Map<string, Map<string, any>>();

  console.warn(
    'Using in-memory store for MCP. State will not persist across restarts.',
  );

  return {
    get: async (key: string) => store.get(key),
    set: async (key: string, value: any) => {
      store.set(key, value);
      return 'OK';
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
    hset: async (key: string, value: Record<string, any>) => {
      if (!hashStore.has(key)) {
        hashStore.set(key, new Map());
      }
      const hash = hashStore.get(key) as Map<string, any>;

      if (typeof value === 'object') {
        Object.entries(value).forEach(([field, val]) => {
          hash.set(field, val);
        });
        return Object.keys(value).length;
      }

      return 0;
    },
    hget: async (key: string, field: string) => {
      const hash = hashStore.get(key);
      return hash ? hash.get(field) : null;
    },
    ping: async () => 'PONG',
  };
}

// Helper function to validate Redis connection for MCP
export async function validateRedisConnection(redis: Redis): Promise<boolean> {
  try {
    const pingResult = await redis.ping();
    return pingResult === 'PONG';
  } catch (error) {
    console.error('Redis connection validation failed:', error);
    return false;
  }
}
