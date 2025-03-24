// Super simple script to test Redis connection using curl
const { exec } = require('child_process');
const fs = require('fs');

// Read environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].replace(/^["']|["']$/g, '').trim();
    envVars[key] = value;
  }
});

// Get Redis credentials
const redisUrl = envVars.KV_REST_API_URL || envVars.UPSTASH_REDIS_REST_URL;
const redisToken =
  envVars.KV_REST_API_TOKEN || envVars.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.error('Redis credentials not found in environment variables');
  process.exit(1);
}

console.log('Redis URL:', redisUrl);
console.log(
  'Token:',
  redisToken.substring(0, 5) +
    '...' +
    redisToken.substring(redisToken.length - 5),
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
    return;
  }

  if (stderr) {
    console.error('stderr:', stderr);
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
      return;
    }

    if (getStderr) {
      console.error('stderr:', getStderr);
      return;
    }

    console.log('Get Response:', getStdout);

    try {
      const response = JSON.parse(getStdout);
      console.log('Redis value:', response.result);
      console.log('\nRedis connection is working!');
    } catch (e) {
      console.error('Failed to parse Redis response:', e);
    }
  });
});
