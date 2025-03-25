#!/usr/bin/env node
const { spawn, exec } = require('node:child_process');
const readline = require('node:readline');

// Configuration
const POSTGRES_PORT = 5432;
const POSTGRES_USER = 'postgres';
const POSTGRES_PASSWORD = 'postgres';
const POSTGRES_DB = 'uniwise';
const CONTAINER_NAME = 'uniwise-postgres';

// Helper for console output with timestamps
const timestamp = () => new Date().toISOString();
const log = (message) => console.log(`[${timestamp()}] ${message}`);
const error = (message) => console.error(`[${timestamp()}] ERROR: ${message}`);

// Check if Docker is running
async function checkDockerRunning() {
  return new Promise((resolve) => {
    exec('docker info', (err) => {
      if (err) {
        error(
          'Docker is not running. Please start Docker Desktop or Docker daemon first.',
        );
        resolve(false);
      } else {
        log('Docker is running.');
        resolve(true);
      }
    });
  });
}

// Check if the container already exists
async function checkContainerExists() {
  return new Promise((resolve) => {
    exec(`docker ps -a -q -f name=${CONTAINER_NAME}`, (err, stdout) => {
      if (err) {
        error(`Error checking for container: ${err.message}`);
        resolve(false);
        return;
      }

      resolve(stdout.trim().length > 0);
    });
  });
}

// Check if container is running
async function isContainerRunning() {
  return new Promise((resolve) => {
    exec(`docker ps -q -f name=${CONTAINER_NAME}`, (err, stdout) => {
      if (err) {
        error(`Error checking if container is running: ${err.message}`);
        resolve(false);
        return;
      }

      resolve(stdout.trim().length > 0);
    });
  });
}

// Start an existing container
async function startExistingContainer() {
  log(`Starting existing PostgreSQL container: ${CONTAINER_NAME}...`);

  return new Promise((resolve, reject) => {
    const startCmd = spawn('docker', ['start', CONTAINER_NAME]);

    startCmd.stdout.pipe(process.stdout);
    startCmd.stderr.pipe(process.stderr);

    startCmd.on('close', (code) => {
      if (code === 0) {
        log('Successfully started existing container.');
        resolve(true);
      } else {
        error(`Failed to start container. Exit code: ${code}`);
        reject(new Error(`Failed to start container. Exit code: ${code}`));
      }
    });
  });
}

// Create and start a new container
async function createAndStartContainer() {
  log('Creating new PostgreSQL container...');

  return new Promise((resolve, reject) => {
    const createCmd = spawn('docker', [
      'run',
      '--name',
      CONTAINER_NAME,
      '-e',
      `POSTGRES_PASSWORD=${POSTGRES_PASSWORD}`,
      '-e',
      `POSTGRES_USER=${POSTGRES_USER}`,
      '-e',
      `POSTGRES_DB=${POSTGRES_DB}`,
      '-p',
      `${POSTGRES_PORT}:5432`,
      '-d',
      'postgres:14',
    ]);

    createCmd.stdout.pipe(process.stdout);
    createCmd.stderr.pipe(process.stderr);

    createCmd.on('close', (code) => {
      if (code === 0) {
        log('Successfully created and started new container.');
        resolve(true);
      } else {
        error(`Failed to create container. Exit code: ${code}`);
        reject(new Error(`Failed to create container. Exit code: ${code}`));
      }
    });
  });
}

// Test PostgreSQL connection
async function testPostgresConnection() {
  log('Testing PostgreSQL connection...');

  return new Promise((resolve) => {
    // Wait a few seconds for PostgreSQL to be ready
    setTimeout(() => {
      exec(`docker exec ${CONTAINER_NAME} pg_isready`, (err, stdout) => {
        if (err) {
          error(`PostgreSQL connection test failed: ${err.message}`);
          resolve(false);
          return;
        }

        if (stdout.includes('accepting connections')) {
          log('PostgreSQL is ready and accepting connections!');
          resolve(true);
        } else {
          error('PostgreSQL is not accepting connections yet.');
          resolve(false);
        }
      });
    }, 3000); // Give PostgreSQL a few seconds to start
  });
}

// Main function
async function main() {
  try {
    // Check if Docker is running
    const dockerRunning = await checkDockerRunning();
    if (!dockerRunning) {
      process.exit(1);
    }

    // Check if container exists
    const containerExists = await checkContainerExists();

    if (containerExists) {
      // Check if container is already running
      const containerRunning = await isContainerRunning();

      if (containerRunning) {
        log(`PostgreSQL container is already running.`);
      } else {
        // Start existing container
        await startExistingContainer();
      }
    } else {
      // Create and start new container
      await createAndStartContainer();
    }

    // Test connection
    const isConnected = await testPostgresConnection();

    if (isConnected) {
      log('✅ PostgreSQL is ready for use!');
      log(
        'Connection string: postgres://postgres:postgres@localhost:5432/uniwise',
      );
      log(
        '\nPress Ctrl+C to stop this script (PostgreSQL will continue running).',
      );

      // Keep the script running to see logs
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('SIGINT', () => {
        log('Exiting PostgreSQL setup script.');
        process.exit(0);
      });
    } else {
      error('❌ Unable to connect to PostgreSQL.');
      process.exit(1);
    }
  } catch (err) {
    error(`An error occurred: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main();
