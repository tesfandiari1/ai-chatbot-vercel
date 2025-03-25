#!/usr/bin/env node
const { spawn, exec } = require('node:child_process');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

// Parse command line arguments
const args = process.argv.slice(2);
const isDevMode = args.includes('--dev');
const skipLint = args.includes('--skip-lint');
const skipTypeCheck = args.includes('--skip-type-check');
const skipRedis = args.includes('--skip-redis');
const skipPostgres = args.includes('--skip-postgres');
const skipBuild = args.includes('--skip-build') || isDevMode; // Skip build in dev mode by default
const skipStorybook = args.includes('--skip-storybook');
const skipMcp = args.includes('--skip-mcp');

// Configuration
const CONFIG = {
  logDir: './logs',
  pgPort: 5432,
  redisPort: 6379,
  nextPort: 3000,
  storybookPort: 6006,
  useDockerForDB: true, // Set to false if you're using external databases
};

// Utility to create a timestamp for logs
const timestamp = () => new Date().toISOString();
const log = (message) => console.log(`[${timestamp()}] ${message}`);
const error = (message) => console.error(`[${timestamp()}] ERROR: ${message}`);
const warn = (message) => console.warn(`[${timestamp()}] WARNING: ${message}`);

// Check if a port is in use
const isPortInUse = async (port) => {
  return new Promise((resolve) => {
    const net = require('node:net');
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
};

// Find an available port
const findAvailablePort = async (startPort, endPort = startPort + 10) => {
  for (let port = startPort; port <= endPort; port++) {
    if (!(await isPortInUse(port))) {
      return port;
    }
  }
  throw new Error(
    `No available ports found between ${startPort} and ${endPort}`,
  );
};

// Create a write stream for logging
const setupLogging = async () => {
  try {
    await fs.mkdir(CONFIG.logDir, { recursive: true });
    const logFile = path.join(CONFIG.logDir, `deploy-${Date.now()}.log`);
    const logStream = fsSync.createWriteStream(logFile);

    // Redirect process stdout and stderr to log file as well as console
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);

    process.stdout.write = (chunk, encoding, callback) => {
      logStream.write(chunk, encoding);
      return originalStdoutWrite(chunk, encoding, callback);
    };

    process.stderr.write = (chunk, encoding, callback) => {
      logStream.write(chunk, encoding);
      return originalStderrWrite(chunk, encoding, callback);
    };

    log(`Logging to ${logFile}`);
    return logStream;
  } catch (err) {
    error(`Failed to set up logging: ${err.message}`);
    process.exit(1);
  }
};

// Check environment variables, less strict in dev mode
const checkEnvironmentVariables = async () => {
  log('Checking environment variables...');

  // Different requirements based on mode
  const requiredVars = ['OPENAI_API_KEY'];

  // In production, we require more variables
  if (!isDevMode) {
    requiredVars.push('POSTGRES_URL');

    // Only require Redis vars if we're not skipping Redis
    if (!skipRedis) {
      requiredVars.push('KV_REST_API_URL', 'KV_REST_API_TOKEN');
    }
  }

  const alternateVars = {
    KV_REST_API_URL: 'UPSTASH_REDIS_REST_URL',
    KV_REST_API_TOKEN: 'UPSTASH_REDIS_REST_TOKEN',
  };

  // Check if .env.local exists
  try {
    await fs.access('.env.local');
    log('.env.local file found');
  } catch (err) {
    error('.env.local file not found. Please create one based on .env.example');
    process.exit(1);
  }

  // Read .env.local file
  const envContent = await fs.readFile('.env.local', 'utf8');
  const envVars = {};

  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].replace(/^["']|["']$/g, '').trim();
      envVars[key] = value;
    }
  });

  // Check each required variable
  const missingVars = [];

  for (const varName of requiredVars) {
    // Check if main variable or its alternate exists
    const altVar = alternateVars[varName];
    if (!envVars[varName] && (!altVar || !envVars[altVar])) {
      missingVars.push(varName + (altVar ? ` or ${altVar}` : ''));
    }
  }

  if (missingVars.length > 0) {
    if (isDevMode) {
      warn(`Missing some environment variables: ${missingVars.join(', ')}`);
      warn('Continuing anyway since we are in development mode');
    } else {
      error(
        `Missing required environment variables: ${missingVars.join(', ')}`,
      );
      error('Please update your .env.local file with these variables');
      process.exit(1);
    }
  } else {
    log('All required environment variables are set');
  }
};

// Run linting checks
const runLintChecks = () => {
  if (skipLint) {
    log('Skipping lint checks (--skip-lint flag provided)');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    log('Running lint checks...');
    const lint = spawn('pnpm', ['lint:fix']); // Using lint:fix to auto-fix issues where possible

    lint.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    lint.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    lint.on('close', (code) => {
      if (code === 0) {
        log('Lint checks passed successfully');
        resolve();
      } else {
        if (isDevMode) {
          warn(
            `Lint checks failed with code ${code}, but continuing in development mode`,
          );
          resolve();
        } else {
          error(`Lint checks failed with code ${code}`);
          reject(new Error(`Lint checks failed with code ${code}`));
        }
      }
    });
  });
};

// Run TypeScript type checking
const runTypeChecks = () => {
  if (skipTypeCheck) {
    log('Skipping TypeScript type checking (--skip-type-check flag provided)');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    log('Checking TypeScript types...');
    const tsc = spawn('npx', ['tsc', '--noEmit']);

    tsc.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    tsc.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    tsc.on('close', (code) => {
      if (code === 0) {
        log('TypeScript checks passed successfully');
        resolve();
      } else {
        if (isDevMode) {
          warn(
            `TypeScript checks failed with code ${code}, but continuing in development mode`,
          );
          resolve();
        } else {
          error(`TypeScript checks failed with code ${code}`);
          reject(new Error(`TypeScript checks failed with code ${code}`));
        }
      }
    });
  });
};

// Start MCP server
const startMcpServer = async () => {
  if (skipMcp) {
    log('Skipping MCP server (--skip-mcp flag provided)');
    return null;
  }

  // Check if default port is available
  const isDefaultPortInUse = await isPortInUse(8000);
  let port = 8000;

  if (isDefaultPortInUse) {
    warn(`Port 8000 is already in use for MCP server`);
    try {
      port = await findAvailablePort(8001, 8020);
      log(`Using alternative port ${port} for MCP server`);
    } catch (err) {
      error('Failed to find an available port for MCP server');
      throw err;
    }
  }

  log(`Starting MCP server on port ${port}...`);

  // Set environment variable for MCP server port
  process.env.MCP_SERVER_PORT = port.toString();

  // Update MCP_SERVER_URL to point to the MCP server
  process.env.MCP_SERVER_URL = `http://localhost:${port}/api/mcp/server`;
  log(`MCP_SERVER_URL set to ${process.env.MCP_SERVER_URL}`);

  const mcpServer = spawn('node', ['start-mcp-server.js']);

  mcpServer.stdout.on('data', (data) => {
    process.stdout.write(`[MCP Server] ${data}`);
  });

  mcpServer.stderr.on('data', (data) => {
    process.stderr.write(`[MCP Server] ${data}`);
  });

  mcpServer.on('close', (code) => {
    if (code !== null) {
      error(`MCP server exited with code ${code}`);
    }
  });

  // Give the MCP server a moment to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return mcpServer;
};

// Start PostgreSQL database using Docker (if useDockerForDB is true)
const startPostgres = async () => {
  if (skipPostgres) {
    log('Skipping PostgreSQL setup (--skip-postgres flag provided)');
    return;
  }

  if (!CONFIG.useDockerForDB) {
    log('Skipping PostgreSQL Docker deployment (using external database)');
    return;
  }

  log('Starting PostgreSQL in Docker...');

  // Use our dedicated setup script
  try {
    const setup = spawn('node', ['setup-postgres.js']);

    // Create a promise that resolves when setup.js shows the ready message
    const setupPromise = new Promise((resolve) => {
      const checkOutput = (data) => {
        const output = data.toString();
        if (
          output.includes('PostgreSQL is ready for use') ||
          output.includes('PostgreSQL is ready and accepting connections')
        ) {
          resolve();
        }
      };

      setup.stdout.on('data', (data) => {
        process.stdout.write(data);
        checkOutput(data);
      });

      setup.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });

    // Wait for PostgreSQL to be ready or timeout after 30 seconds
    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('PostgreSQL setup timed out after 30 seconds'));
      }, 30000);
    });

    // Wait for setup to complete or timeout
    await Promise.race([setupPromise, timeout]);

    // Run migrations
    log('Running database migrations in container...');
    const migrate = spawn('node', ['migrate-inside-container.js']);

    migrate.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    migrate.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    const migrateExitCode = await new Promise((resolve) => {
      migrate.on('close', (code) => {
        resolve(code);
      });
    });

    if (migrateExitCode === 0) {
      log('Database migrations completed successfully');
    } else {
      if (isDevMode) {
        warn(
          `Database migrations failed with code ${migrateExitCode}, but continuing in development mode`,
        );
      } else {
        throw new Error(
          `Database migrations failed with code ${migrateExitCode}`,
        );
      }
    }
  } catch (err) {
    error(`Failed to set up PostgreSQL: ${err.message}`);
    if (isDevMode) {
      warn('Continuing without PostgreSQL in development mode');
    } else {
      throw err;
    }
  }
};

// Test Redis connectivity with more error handling
const testRedisConnection = async () => {
  if (!fsSync.existsSync('test-redis.js')) {
    warn('test-redis.js not found, creating a simple version');

    // Create a simple test-redis.js file if it doesn't exist
    const testRedisContent = `#!/usr/bin/env node
    // Simple Redis connectivity test
    require('dotenv').config({ path: '.env.local' });
    const { Redis } = require('@upstash/redis');
    
    async function testRedis() {
      try {
        const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
        
        if (!redisUrl || !redisToken) {
          console.error('Redis credentials not found in environment variables');
          process.exit(1);
        }
        
        const formattedUrl = redisUrl.startsWith('https://') ? redisUrl : \`https://\${redisUrl}\`;
        
        const redis = new Redis({
          url: formattedUrl,
          token: redisToken,
        });
        
        const testKey = 'redis-test-' + Date.now();
        const testValue = 'Connection test: ' + new Date().toISOString();
        
        await redis.set(testKey, testValue);
        const value = await redis.get(testKey);
        
        console.log('Redis connection successful!');
        process.exit(0);
      } catch (error) {
        console.error('Redis connection failed:', error);
        process.exit(1);
      }
    }
    
    testRedis();`;

    await fs.writeFile('test-redis.js', testRedisContent);
    await fsSync.chmodSync('test-redis.js', '755');
  }

  log('Testing Redis connectivity...');

  return new Promise((resolve, reject) => {
    const redis = spawn('node', ['test-redis.js']);

    redis.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    redis.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    redis.on('close', (code) => {
      if (code === 0) {
        log('Redis connection test passed successfully');
        resolve();
      } else {
        error(`Redis connection test failed with code ${code}`);
        reject(new Error(`Redis connection test failed with code ${code}`));
      }
    });
  });
};

// Start Redis locally if needed (using Docker)
const startRedis = async () => {
  if (skipRedis) {
    log('Skipping Redis setup (--skip-redis flag provided)');
    return;
  }

  if (!CONFIG.useDockerForDB) {
    log('Skipping Redis Docker deployment (using external Redis)');
    try {
      await testRedisConnection();
    } catch (err) {
      if (isDevMode) {
        warn(`Redis connection test failed: ${err.message}`);
        warn('Continuing without Redis in development mode');
      } else {
        throw err;
      }
    }
    return;
  }

  log('Starting Redis in Docker...');

  // Check if docker is running
  try {
    await new Promise((resolve, reject) => {
      exec('docker --version', (err, stdout) => {
        if (err) {
          reject(
            new Error('Docker does not appear to be installed or running'),
          );
          return;
        }
        resolve();
      });
    });
  } catch (err) {
    if (isDevMode) {
      warn(`Docker check failed: ${err.message}`);
      warn('Skipping Redis setup in development mode');
      return;
    } else {
      throw err;
    }
  }

  // Check if redis container is already running
  const checkContainer = () => {
    return new Promise((resolve, reject) => {
      exec('docker ps -q -f name=uniwise-redis', (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stdout.trim());
      });
    });
  };

  try {
    const containerId = await checkContainer();

    if (containerId) {
      log('Redis container is already running');
    } else {
      // Start a new Redis container
      await new Promise((resolve, reject) => {
        const docker = spawn('docker', [
          'run',
          '--name',
          'uniwise-redis',
          '-p',
          `${CONFIG.redisPort}:6379`,
          '-d',
          'redis:7',
        ]);

        let dockerOutput = '';

        docker.stdout.on('data', (data) => {
          dockerOutput += data.toString();
        });

        docker.stderr.on('data', (data) => {
          process.stderr.write(data);
        });

        docker.on('close', (code) => {
          if (code === 0) {
            log(`Redis container started: ${dockerOutput.trim()}`);

            // Set environment variables for Redis
            if (
              !process.env.KV_REST_API_URL &&
              !process.env.UPSTASH_REDIS_REST_URL
            ) {
              process.env.KV_REST_API_URL = 'redis://localhost:6379';
              log('Set KV_REST_API_URL environment variable for local Redis');
            }

            resolve();
          } else {
            reject(new Error(`Failed to start Redis container, code ${code}`));
          }
        });
      });

      // Wait for Redis to be ready
      log('Waiting for Redis to be ready...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Now test the connection
    try {
      await testRedisConnection();
    } catch (err) {
      if (isDevMode) {
        warn(`Redis connection test failed: ${err.message}`);
        warn('Continuing without verified Redis in development mode');
      } else {
        throw err;
      }
    }
  } catch (err) {
    error(`Failed to set up Redis: ${err.message}`);
    if (isDevMode) {
      warn('Continuing without Redis in development mode');
    } else {
      throw err;
    }
  }
};

// Build the Next.js application
const buildNextApp = () => {
  if (skipBuild) {
    log('Skipping Next.js build (--skip-build flag provided or in dev mode)');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    log('Building Next.js application...');
    const build = spawn('pnpm', ['build']);

    build.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    build.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    build.on('close', (code) => {
      if (code === 0) {
        log('Next.js build completed successfully');
        resolve();
      } else {
        error(`Next.js build failed with code ${code}`);
        reject(new Error(`Next.js build failed with code ${code}`));
      }
    });
  });
};

// Start the Next.js application
const startNextApp = () => {
  log(`Starting Next.js application on port ${CONFIG.nextPort}...`);

  const next = spawn('pnpm', ['start', '--', '-p', CONFIG.nextPort.toString()]);

  next.stdout.on('data', (data) => {
    process.stdout.write(`[Next.js] ${data}`);
  });

  next.stderr.on('data', (data) => {
    process.stderr.write(`[Next.js] ${data}`);
  });

  next.on('close', (code) => {
    if (code !== null) {
      error(`Next.js app exited with code ${code}`);
    }
  });

  return next;
};

// Start Next.js in development mode
const startNextDev = async () => {
  // Check if default port is available
  const isDefaultPortInUse = await isPortInUse(CONFIG.nextPort);
  let port = CONFIG.nextPort;

  if (isDefaultPortInUse) {
    warn(`Port ${CONFIG.nextPort} is already in use for Next.js`);
    try {
      port = await findAvailablePort(3001, 3020);
      log(`Using alternative port ${port} for Next.js`);
    } catch (err) {
      error('Failed to find an available port for Next.js');
      throw err;
    }
  }

  log(`Starting Next.js in development mode on port ${port}...`);

  const next = spawn('pnpm', ['dev', '--', '-p', port.toString()]);

  next.stdout.on('data', (data) => {
    process.stdout.write(`[Next.js] ${data}`);
  });

  next.stderr.on('data', (data) => {
    process.stderr.write(`[Next.js] ${data}`);
  });

  next.on('close', (code) => {
    if (code !== null) {
      error(`Next.js dev server exited with code ${code}`);
    }
  });

  // Update the port in case we're using an alternative
  CONFIG.nextPort = port;

  return next;
};

// Clear Storybook cache before starting
const clearStorybookCache = async () => {
  log('Clearing Storybook cache...');

  // Create an array of potential Storybook cache locations
  const cacheDirs = ['./.storybook/cache', './node_modules/.cache/storybook'];

  for (const cacheDir of cacheDirs) {
    try {
      await fs.rm(cacheDir, { recursive: true, force: true });
      log(`Cleared Storybook cache: ${cacheDir}`);
    } catch (err) {
      // Ignore errors if directory doesn't exist
      if (err.code !== 'ENOENT') {
        warn(`Error clearing cache at ${cacheDir}: ${err.message}`);
      }
    }
  }
};

// Start Storybook
const startStorybook = async () => {
  if (skipStorybook) {
    log('Skipping Storybook (--skip-storybook flag provided)');
    return null;
  }

  // Check if default port is available
  const isDefaultPortInUse = await isPortInUse(CONFIG.storybookPort);
  let port = CONFIG.storybookPort;

  if (isDefaultPortInUse) {
    warn(`Port ${CONFIG.storybookPort} is already in use for Storybook`);
    try {
      port = await findAvailablePort(6007, 6030);
      log(`Using alternative port ${port} for Storybook`);
    } catch (err) {
      error('Failed to find an available port for Storybook');
      throw err;
    }
  }

  log(`Starting Storybook on port ${port}...`);

  const storybook = spawn('pnpm', [
    'storybook',
    '--',
    '-p',
    port.toString(),
    '--no-manager-cache',
    '--no-version-updates',
    '--quiet',
  ]);

  storybook.stdout.on('data', (data) => {
    process.stdout.write(`[Storybook] ${data}`);
  });

  storybook.stderr.on('data', (data) => {
    process.stderr.write(`[Storybook] ${data}`);
  });

  storybook.on('close', (code) => {
    if (code !== null) {
      error(`Storybook exited with code ${code}`);
    }
  });

  // Update the port in case we're using an alternative
  CONFIG.storybookPort = port;

  return storybook;
};

// Display help information
const showHelp = () => {
  console.log(`
  UniWise Local Deployment Script

  Usage:
    node local-deploy.js [options]

  Options:
    --dev                 Run in development mode (skips build by default)
    --skip-lint           Skip linting checks
    --skip-type-check     Skip TypeScript type checking
    --skip-redis          Skip Redis setup and checks
    --skip-postgres       Skip PostgreSQL setup and checks
    --skip-build          Skip Next.js build step
    --skip-storybook      Skip starting Storybook
    --skip-mcp            Skip MCP server setup
    --help                Show this help message

  Examples:
    node local-deploy.js                   # Run in production mode
    node local-deploy.js --dev             # Run in development mode
    node local-deploy.js --skip-redis      # Skip Redis setup
    node local-deploy.js --dev --skip-lint # Development mode without linting
  `);
  process.exit(0);
};

// Main function
const main = async () => {
  // Show help if requested
  if (args.includes('--help')) {
    showHelp();
  }

  // Store child processes to handle cleanup later
  const childProcesses = [];

  try {
    // Set up logging
    const logStream = await setupLogging();

    // Check environment variables
    await checkEnvironmentVariables();

    // Run lint and type checks in parallel
    log('Running code quality checks...');
    await Promise.all([runLintChecks(), runTypeChecks()]);

    // Start databases in parallel if possible
    log('Setting up databases...');
    const dbPromises = [];
    if (!skipPostgres) dbPromises.push(startPostgres());
    if (!skipRedis) dbPromises.push(startRedis());

    if (dbPromises.length > 0) {
      await Promise.all(dbPromises);
    }

    // Build the Next.js app
    await buildNextApp();

    // Start the applications
    log(
      `Starting applications in ${isDevMode ? 'development' : 'production'} mode...`,
    );

    if (isDevMode) {
      childProcesses.push(await startNextDev());
    } else {
      childProcesses.push(startNextApp());
    }

    // Start Storybook if not skipped
    if (!skipStorybook) {
      await clearStorybookCache();
      const storybook = await startStorybook();
      if (storybook) {
        childProcesses.push(storybook);
      }
    }

    // Start MCP server
    const mcpServer = await startMcpServer();
    if (mcpServer) {
      childProcesses.push(mcpServer);
    }

    log('All services started successfully!');
    log(`
    🚀 Services running:
      - Next.js: http://localhost:${CONFIG.nextPort}
      ${!skipStorybook ? `- Storybook: http://localhost:${CONFIG.storybookPort}` : ''}
      ${!skipPostgres ? `- PostgreSQL: localhost:${CONFIG.pgPort}` : ''}
      ${!skipRedis ? `- Redis: localhost:${CONFIG.redisPort}` : ''}
      ${!skipMcp ? `- MCP Server: ${process.env.MCP_SERVER_URL}` : ''}
    `);

    // Handle process termination
    const cleanup = () => {
      log('Shutting down services...');

      for (const proc of childProcesses) {
        if (proc && !proc.killed) {
          proc.kill();
        }
      }

      logStream.end();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Set up CLI interface for commands while running
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'uniwise> ',
    });

    rl.prompt();

    rl.on('line', (line) => {
      const cmd = line.trim();

      if (cmd === 'quit' || cmd === 'exit') {
        cleanup();
      } else if (cmd === 'help') {
        console.log(`
        Available commands:
          - help: Show this help message
          - status: Show status of services
          - logs: Show log file location
          - quit/exit: Shutdown all services and exit
        `);
      } else if (cmd === 'status') {
        console.log(`
        Status:
          - Next.js: ${childProcesses[0] && !childProcesses[0].killed ? 'running' : 'stopped'}
          ${childProcesses[1] ? `- Storybook: ${!childProcesses[1].killed ? 'running' : 'stopped'}` : ''}
        `);
      } else if (cmd === 'logs') {
        console.log(`Logs are being written to: ${CONFIG.logDir}`);
      } else {
        console.log(
          `Unknown command: ${cmd}. Type 'help' for available commands.`,
        );
      }

      rl.prompt();
    });
  } catch (err) {
    error(`Deployment failed: ${err.message}`);

    // Kill any started processes
    for (const proc of childProcesses) {
      if (proc && !proc.killed) {
        proc.kill();
      }
    }

    process.exit(1);
  }
};

// Start the script
main();
