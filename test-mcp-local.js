// Simple script to test MCP functionality locally
// Read environment variables directly from .env.local
const fs = require('node:fs');
const https = require('node:https');
const http = require('node:http');

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].replace(/^["']|["']$/g, '').trim();
    envVars[key] = value;
    process.env[key] = value;
  }
});

async function testMcp() {
  try {
    console.log('Testing MCP functionality locally...');

    // First test Redis connectivity
    console.log('\n1. Testing Redis connection:');
    await testRedisConnection();

    // Then test MCP server
    console.log('\n2. Testing MCP server:');
    await testMcpServer();

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
    process.exit(1);
  }
}

function httpRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const lib = isHttps ? https : http;

    const req = lib.request(url, options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const contentType = res.headers['content-type'];
          if (contentType?.includes('application/json')) {
            responseBody = JSON.parse(responseBody);
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              body: responseBody,
              statusCode: res.statusCode,
              headers: res.headers,
            });
          } else {
            reject(
              new Error(
                `Request failed with status ${res.statusCode}: ${responseBody}`,
              ),
            );
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }

    req.end();
  });
}

async function testRedisConnection() {
  try {
    // Get Redis credentials from environment variables
    const url = envVars.UPSTASH_REDIS_REST_URL || envVars.KV_REST_API_URL;
    const token = envVars.UPSTASH_REDIS_REST_TOKEN || envVars.KV_REST_API_TOKEN;

    if (!url || !token) {
      throw new Error('Redis credentials not found in environment variables');
    }

    console.log('Redis URL:', url);

    // Make a direct API call to Upstash Redis
    const testKey = `mcp-test-key-${Date.now()}`;
    const testValue = `MCP Redis test at ${new Date().toISOString()}`;

    // Set a value using REST API
    console.log(`Setting key: ${testKey}`);
    const setUrl = `${url}/set/${testKey}/${encodeURIComponent(testValue)}`;
    const setOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const setResponse = await httpRequest(setUrl, setOptions);
    console.log('Set response:', setResponse.body);

    // Get the value back
    console.log('Reading key back...');
    const getUrl = `${url}/get/${testKey}`;
    const getOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const getResponse = await httpRequest(getUrl, getOptions);
    console.log('Success! Retrieved value:', getResponse.body.result);
  } catch (error) {
    console.error('Redis test failed:', error);
    throw error;
  }
}

async function testMcpServer() {
  try {
    const mcpUrl = 'http://localhost:3001/api/mcp/server';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const data = {
      jsonrpc: '2.0',
      id: '1',
      method: 'listTools',
      params: {},
    };

    console.log(`Sending request to MCP server: ${mcpUrl}`);
    const response = await httpRequest(mcpUrl, options, data);

    console.log('MCP server response:', JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.error('MCP server test failed:', error);
    throw error;
  }
}

// Run the tests
testMcp();
