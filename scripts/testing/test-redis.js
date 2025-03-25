#!/usr/bin/env node
// Script to test Redis connectivity with both client library and curl approaches

require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');
const { exec } = require('node:child_process');
const fs = require('node:fs');

// Parse command line arguments
const args = process.argv.slice(2);
const useCurl = args.includes('--curl') || args.includes('-c');

// Load environment variables
const loadEnvVars = () => {
  try {
    // First try process.env (loaded by dotenv)
    let envVars = process.env;

    // If the required vars are missing, try reading directly from .env.local
    if (!envVars.KV_REST_API_URL && !envVars.UPSTASH_REDIS_REST_URL) {
      console.log('Loading environment variables directly from .env.local...');
      const envContent = fs.readFileSync('.env.local', 'utf8');
      envVars = {};
      envContent.split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].replace(/^["']|["']$/g, '').trim();
          envVars[key] = value;
        }
      });
    }

    return envVars;
  } catch (error) {
    console.error('Error loading environment variables:', error);
    process.exit(1);
  }
};

// Get Redis credentials
const getRedisCredentials = (envVars) => {
  const redisUrl = envVars.KV_REST_API_URL || envVars.UPSTASH_REDIS_REST_URL;
  const redisToken =
    envVars.KV_REST_API_TOKEN || envVars.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error('Redis credentials not found in environment variables');
    process.exit(1);
  }

  return { redisUrl, redisToken };
};

// Test Redis using the SDK
async function testRedisWithSDK() {
  try {
    console.log('Testing Redis connection using SDK...');

    const envVars = loadEnvVars();
    const { redisUrl, redisToken } = getRedisCredentials(envVars);

    console.log('Redis URL found, attempting connection...');

    // Ensure the URL is properly formatted for Upstash Redis
    const formattedUrl = redisUrl.startsWith('https://')
      ? redisUrl
      : `https://${redisUrl}`;

    // Create a Redis client using the provided credentials
    const redis = new Redis({
      url: formattedUrl,
      token: redisToken,
    });

    // Test Redis connection by setting and retrieving a value
    const testKey = 'deploy-test-key';
    const testValue = `Redis connection test successful! ${new Date().toISOString()}`;

    console.log('Setting test value in Redis...');
    await redis.set(testKey, testValue);

    console.log('Retrieving test value from Redis...');
    const value = await redis.get(testKey);

    if (value === testValue) {
      console.log('✅ Redis connection test passed!');
      console.log('Retrieved value:', value);
      return true;
    } else {
      console.error(
        '⚠️ Redis connection test failed: Retrieved different value than set',
      );
      console.error('Expected:', testValue);
      console.error('Received:', value);
      return false;
    }
  } catch (error) {
    console.error('❌ Redis connection test failed with error:', error);
    return false;
  }
}

// Test Redis using curl
function testRedisWithCurl() {
  return new Promise((resolve) => {
    console.log('Testing Redis connection using curl...');

    const envVars = loadEnvVars();
    const { redisUrl, redisToken } = getRedisCredentials(envVars);

    console.log('Redis URL:', redisUrl);
    console.log(
      'Token:',
      `${redisToken.substring(0, 5)}...${redisToken.substring(redisToken.length - 5)}`,
    );

    // Create a test key
    const testKey = `test-key-${Date.now()}`;
    const testValue = `Test value at ${new Date().toISOString()}`;

    // Create the curl command
    const curlCmd = `curl "${redisUrl}/set/${testKey}/${encodeURIComponent(testValue)}" -H "Authorization: Bearer ${redisToken}"`;

    console.log('\nExecuting:', curlCmd.replace(redisToken, '[REDACTED]'));

    // Execute the curl command
    exec(curlCmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Error setting Redis key:', error);
        resolve(false);
        return;
      }

      if (stderr) {
        console.error('stderr:', stderr);
        resolve(false);
        return;
      }

      console.log('Set Response:', stdout);

      // Now try to get the value back
      const getCmd = `curl "${redisUrl}/get/${testKey}" -H "Authorization: Bearer ${redisToken}"`;
      console.log(
        '\nGetting value with:',
        getCmd.replace(redisToken, '[REDACTED]'),
      );

      exec(getCmd, (getError, getStdout, getStderr) => {
        if (getError) {
          console.error('Error getting Redis key:', getError);
          resolve(false);
          return;
        }

        if (getStderr) {
          console.error('stderr:', getStderr);
          resolve(false);
          return;
        }

        console.log('Get Response:', getStdout);

        try {
          const response = JSON.parse(getStdout);
          console.log('Redis value:', response.result);
          console.log('\n✅ Redis connection is working!');
          resolve(true);
        } catch (e) {
          console.error('Failed to parse Redis response:', e);
          resolve(false);
        }
      });
    });
  });
}

// Main function
async function main() {
  console.log('Redis Connection Tester');
  console.log('======================');

  if (useCurl) {
    console.log('Using curl method (--curl flag provided)');
    const success = await testRedisWithCurl();
    process.exit(success ? 0 : 1);
  } else {
    console.log(
      'Using SDK method (default, use --curl flag to test with curl)',
    );
    const success = await testRedisWithSDK();
    process.exit(success ? 0 : 1);
  }
}

// Execute the main function
main();
