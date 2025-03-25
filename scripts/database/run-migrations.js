#!/usr/bin/env node
const { spawn } = require('node:child_process');

// Helper for console output with timestamps
const timestamp = () => new Date().toISOString();
const log = (message) => console.log(`[${timestamp()}] ${message}`);
const error = (message) => console.error(`[${timestamp()}] ERROR: ${message}`);

// Run database migrations
async function runMigrations() {
  log('Running database migrations...');

  return new Promise((resolve, reject) => {
    // Use tsx to run the TypeScript migration file
    const migrate = spawn('npx', ['tsx', 'lib/db/migrate.ts']);

    migrate.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    migrate.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    migrate.on('close', (code) => {
      if (code === 0) {
        log('✅ Database migrations completed successfully!');
        resolve(true);
      } else {
        error(`❌ Database migrations failed with code ${code}`);
        reject(new Error(`Database migrations failed with code ${code}`));
      }
    });
  });
}

// Main function
async function main() {
  try {
    await runMigrations();
    log('Database is now ready for use.');
    process.exit(0);
  } catch (err) {
    error(`An error occurred: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main();
