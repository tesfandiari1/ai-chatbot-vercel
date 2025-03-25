#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { spawn, exec } = require('node:child_process');
const { createClient } = require('redis');
const { Pool } = require('pg');
const fs = require('node:fs');
const net = require('node:net');

// Configuration
const SERVICES = {
  NEXT: { name: 'Next.js', port: 3000, defaultCommand: 'pnpm dev -p 3000' },
  REDIS: { name: 'Redis', port: 6379, defaultCommand: 'redis-server' },
  POSTGRES: { name: 'PostgreSQL', port: 5432 },
  STORYBOOK: {
    name: 'Storybook',
    port: 6006,
    defaultCommand: 'node scripts/storybook-start.js',
  },
};

// Check if a port is in use (service is running)
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // For port 3000, automatically kill the process instead of reporting as in use
        if (port === 3000) {
          try {
            console.log('Port 3000 is in use. Attempting to free it...');
            if (process.platform !== 'win32') {
              // For macOS/Linux
              exec(`lsof -i :3000 -t | xargs kill -9`, (error) => {
                if (error) {
                  console.warn(
                    'Failed to kill process on port 3000:',
                    error.message,
                  );
                  resolve(true); // Still in use
                } else {
                  console.log('Successfully freed port 3000');
                  resolve(false); // Now free
                }
              });
            } else {
              // For Windows
              exec(
                'FOR /F "tokens=5" %P IN (\'netstat -aon ^| findstr :3000\') DO TaskKill /PID %P /F',
                { shell: true },
                (error) => {
                  if (error) {
                    console.warn(
                      'Failed to kill process on port 3000:',
                      error.message,
                    );
                    resolve(true); // Still in use
                  } else {
                    console.log('Successfully freed port 3000');
                    resolve(false); // Now free
                  }
                },
              );
            }
          } catch (error) {
            console.warn('Error trying to free port 3000:', error.message);
            resolve(true); // Still in use
          }
        } else {
          resolve(true); // Port is in use for other ports
        }
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false); // Port is free
    });

    server.listen(port);
  });
}

// Test Redis connection
async function testRedisConnection() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({ url: redisUrl });

    await client.connect();
    await client.ping();
    await client.disconnect();

    return { running: true, url: redisUrl };
  } catch (error) {
    return { running: false, error: error.message };
  }
}

// Test Postgres connection
async function testPostgresConnection() {
  try {
    const pgUrl = process.env.POSTGRES_URL;
    if (!pgUrl) {
      return { running: false, error: 'POSTGRES_URL not set in environment' };
    }

    const pool = new Pool({ connectionString: pgUrl });
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await pool.end();

    return { running: true, url: pgUrl };
  } catch (error) {
    return { running: false, error: error.message };
  }
}

// Start a service
function startService(serviceName) {
  const service = SERVICES[serviceName];
  if (!service.defaultCommand) {
    console.log(
      `⚠️  No default command configured for ${service.name}. Please start it manually.`,
    );
    return;
  }

  console.log(`🚀 Starting ${service.name}...`);

  const [cmd, ...args] = service.defaultCommand.split(' ');
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    detached: true,
  });

  child.unref(); // Detach child process

  console.log(`✅ ${service.name} starting with PID ${child.pid}`);
}

// Main function
async function checkServices() {
  console.log('🔍 Checking services...\n');
  const results = {};

  // Check Next.js
  const nextRunning = await isPortInUse(SERVICES.NEXT.port);
  results.next = {
    running: nextRunning,
    port: SERVICES.NEXT.port,
  };

  // Check Redis
  const redisStatus = await testRedisConnection();
  results.redis = {
    running: redisStatus.running,
    port: SERVICES.REDIS.port,
    url: redisStatus.running ? redisStatus.url : undefined,
    error: redisStatus.running ? undefined : redisStatus.error,
  };

  // Check PostgreSQL
  const pgStatus = await testPostgresConnection();
  results.postgres = {
    running: pgStatus.running,
    port: SERVICES.POSTGRES.port,
    url: pgStatus.running ? pgStatus.url : undefined,
    error: pgStatus.running ? undefined : pgStatus.error,
  };

  // Check Storybook
  const storybookRunning = await isPortInUse(SERVICES.STORYBOOK.port);
  results.storybook = {
    running: storybookRunning,
    port: SERVICES.STORYBOOK.port,
  };

  // Print results
  console.log('Services status:');
  console.log('================');

  for (const [key, service] of Object.entries(results)) {
    const status = service.running ? '✅ Running' : '❌ Not running';
    const portInfo = service.port ? `Port: ${service.port}` : '';
    console.log(`${SERVICES[key.toUpperCase()].name}: ${status} ${portInfo}`);

    if (service.error) {
      console.log(`   Error: ${service.error}`);
    }
  }

  // Ask to start services
  if (
    !results.next.running ||
    !results.redis.running ||
    !results.postgres.running
  ) {
    console.log('\nWould you like to start missing services? (y/n)');
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        if (!results.next.running) startService('NEXT');
        if (!results.redis.running) startService('REDIS');
        if (!results.storybook.running) {
          console.log('\nWould you like to start Storybook? (y/n)');
          process.stdin.once('data', (data) => {
            const answer = data.toString().trim().toLowerCase();
            if (answer === 'y' || answer === 'yes') {
              startService('STORYBOOK');
            }
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      } else {
        process.exit(0);
      }
    });
  } else {
    console.log('\n✅ All services are running.');
    process.exit(0);
  }
}

// Run the script
checkServices().catch((error) => {
  console.error('Error checking services:', error);
  process.exit(1);
});
