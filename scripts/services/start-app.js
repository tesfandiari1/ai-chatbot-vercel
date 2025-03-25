#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { spawn, exec } = require('node:child_process');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}Starting the application...${colors.reset}`);

// Validate Redis environment variables
function validateRedisConfig() {
  console.log(`${colors.blue}Checking Redis configuration...${colors.reset}`);

  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;

  if (!redisUrl || !redisToken) {
    console.log(
      `${colors.red}Redis configuration is incomplete:${colors.reset}`,
    );
    console.log(`KV_REST_API_URL: ${redisUrl ? 'Set ✓' : 'Not set ✗'}`);
    console.log(`KV_REST_API_TOKEN: ${redisToken ? 'Set ✓' : 'Not set ✗'}`);

    return false;
  }

  console.log(
    `${colors.green}Redis configuration is complete ✓${colors.reset}`,
  );
  return true;
}

// Validate PostgreSQL environment variables and connection
async function validatePostgresConfig() {
  console.log(
    `${colors.blue}Checking PostgreSQL configuration...${colors.reset}`,
  );

  const pgUrl = process.env.POSTGRES_URL;

  if (!pgUrl) {
    console.log(
      `${colors.red}PostgreSQL configuration is incomplete:${colors.reset}`,
    );
    console.log(`POSTGRES_URL: Not set ✗`);
    return false;
  }

  console.log(`POSTGRES_URL: Set ✓`);

  // Test the connection
  try {
    const pool = new Pool({ connectionString: pgUrl });
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await pool.end();

    console.log(
      `${colors.green}PostgreSQL connection successful ✓${colors.reset}`,
    );
    return true;
  } catch (error) {
    console.log(
      `${colors.red}PostgreSQL connection failed: ${error.message}${colors.reset}`,
    );
    return false;
  }
}

// Check if port 3000 is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
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

// Kill process on port 3000
function killProcessOnPort(port) {
  return new Promise((resolve, reject) => {
    const command =
      process.platform !== 'win32'
        ? `lsof -i :${port} -t | xargs kill -9`
        : `FOR /F "tokens=5" %P IN ('netstat -aon ^| findstr :${port}') DO TaskKill /PID %P /F`;

    console.log(
      `${colors.yellow}Killing process on port ${port}...${colors.reset}`,
    );

    exec(command, { shell: true }, (error) => {
      if (error) {
        console.log(
          `${colors.yellow}No process found on port ${port} or failed to kill${colors.reset}`,
        );
      } else {
        console.log(
          `${colors.green}Successfully freed port ${port}${colors.reset}`,
        );
      }

      // We resolve either way, as we'll check again if the port is free
      resolve();
    });
  });
}

// Start the Next.js app
function startNextApp() {
  console.log(
    `${colors.magenta}Starting Next.js app on port 3000...${colors.reset}`,
  );

  // Determine which package manager to use
  const packageManager = fs.existsSync(
    path.join(process.cwd(), 'pnpm-lock.yaml'),
  )
    ? 'pnpm'
    : 'npm';

  const nextProcess = spawn(packageManager, ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: '3000' },
  });

  nextProcess.on('error', (error) => {
    console.error(
      `${colors.red}Failed to start Next.js app: ${error.message}${colors.reset}`,
    );
    process.exit(1);
  });

  return nextProcess;
}

// Start the MCP server
function startMcpServer() {
  console.log(`${colors.magenta}Starting MCP server...${colors.reset}`);

  const mcpProcess = spawn('node', ['scripts/testing/test-mcp-local.js'], {
    stdio: 'inherit',
    shell: true,
  });

  mcpProcess.on('error', (error) => {
    console.error(
      `${colors.red}Failed to start MCP server: ${error.message}${colors.reset}`,
    );
  });

  return mcpProcess;
}

// Start PostgreSQL if needed and possible
function startPostgresIfNeeded() {
  // Check if we have a command to start Postgres
  if (process.platform === 'darwin') {
    // macOS
    console.log(
      `${colors.magenta}Attempting to start PostgreSQL...${colors.reset}`,
    );
    exec(
      'brew services start postgresql@14 || brew services start postgresql',
      (error) => {
        if (error) {
          console.log(
            `${colors.yellow}Failed to start PostgreSQL via Homebrew. You may need to start it manually.${colors.reset}`,
          );
          console.log(`Try running: brew services start postgresql`);
        } else {
          console.log(
            `${colors.green}PostgreSQL service started successfully ✓${colors.reset}`,
          );
        }
      },
    );
  } else if (process.platform === 'linux') {
    // Linux
    console.log(
      `${colors.magenta}Attempting to start PostgreSQL...${colors.reset}`,
    );
    exec(
      'sudo service postgresql start || systemctl start postgresql',
      (error) => {
        if (error) {
          console.log(
            `${colors.yellow}Failed to start PostgreSQL service. You may need to start it manually.${colors.reset}`,
          );
        } else {
          console.log(
            `${colors.green}PostgreSQL service started successfully ✓${colors.reset}`,
          );
        }
      },
    );
  } else if (process.platform === 'win32') {
    // Windows
    console.log(
      `${colors.magenta}Attempting to start PostgreSQL...${colors.reset}`,
    );
    exec('net start postgresql-x64-14 || net start postgresql', (error) => {
      if (error) {
        console.log(
          `${colors.yellow}Failed to start PostgreSQL service. You may need to start it manually.${colors.reset}`,
        );
      } else {
        console.log(
          `${colors.green}PostgreSQL service started successfully ✓${colors.reset}`,
        );
      }
    });
  } else {
    console.log(
      `${colors.yellow}Automatic PostgreSQL startup not supported on this platform. Please start it manually.${colors.reset}`,
    );
  }
}

// Main function
async function main() {
  try {
    // Check Redis configuration
    if (!validateRedisConfig()) {
      console.log(
        `${colors.yellow}WARNING: Redis configuration incomplete, MCP might not work correctly${colors.reset}`,
      );
    }

    // Check PostgreSQL configuration
    const pgStatus = await validatePostgresConfig();
    if (!pgStatus) {
      console.log(
        `${colors.yellow}WARNING: PostgreSQL connection failed, attempting to start the service...${colors.reset}`,
      );
      startPostgresIfNeeded();
      // Give PostgreSQL some time to start
      console.log(
        `${colors.blue}Waiting for PostgreSQL to start...${colors.reset}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Try to validate again
      const retryStatus = await validatePostgresConfig();
      if (!retryStatus) {
        console.log(
          `${colors.yellow}WARNING: PostgreSQL is still not available. The application may not function correctly.${colors.reset}`,
        );
      }
    }

    // Check if port 3000 is in use
    if (await isPortInUse(3000)) {
      console.log(`${colors.yellow}Port 3000 is already in use${colors.reset}`);
      await killProcessOnPort(3000);

      // Check again after killing
      if (await isPortInUse(3000)) {
        console.error(
          `${colors.red}Failed to free port 3000. Please close any application using it.${colors.reset}`,
        );
        process.exit(1);
      }
    }

    // Start Next.js app
    const nextProcess = startNextApp();

    // Wait a moment before starting MCP server
    setTimeout(() => {
      const mcpProcess = startMcpServer();

      // Handle process termination
      process.on('SIGINT', () => {
        console.log(`${colors.yellow}Shutting down...${colors.reset}`);
        nextProcess.kill();
        mcpProcess.kill();
        process.exit(0);
      });
    }, 3000);
  } catch (error) {
    console.error(
      `${colors.red}Error starting application: ${error.message}${colors.reset}`,
    );
    process.exit(1);
  }
}

// Run the script
main();
