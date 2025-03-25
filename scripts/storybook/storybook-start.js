#!/usr/bin/env node
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');

// Function to clear Storybook cache
async function clearStorybookCache() {
  console.log('Clearing Storybook cache...');

  const cacheDirs = ['./.storybook/cache', './node_modules/.cache/storybook'];

  for (const cacheDir of cacheDirs) {
    try {
      await fs.rm(cacheDir, { recursive: true, force: true });
      console.log(`Cleared cache: ${cacheDir}`);
    } catch (err) {
      // Ignore errors if directory doesn't exist
      if (err.code !== 'ENOENT') {
        console.warn(`Error clearing cache at ${cacheDir}: ${err.message}`);
      }
    }
  }
}

// Main function to start Storybook
async function startStorybook() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const port = args.includes('--port')
    ? args[args.indexOf('--port') + 1]
    : '6006';
  const skipClearCache = args.includes('--skip-clear-cache');

  // Clear cache if not skipped
  if (!skipClearCache) {
    await clearStorybookCache();
  }

  console.log(`Starting Storybook on port ${port}...`);

  // Start Storybook with specific arguments for better MDX support
  const storybook = spawn(
    'pnpm',
    [
      'storybook',
      '--',
      '-p',
      port,
      '--no-manager-cache',
      '--no-version-updates',
    ],
    {
      stdio: 'inherit', // This will pass all output directly to the console
    },
  );

  // Handle errors
  storybook.on('error', (err) => {
    console.error('Failed to start Storybook:', err);
    process.exit(1);
  });

  // Handle process termination
  storybook.on('close', (code) => {
    if (code !== 0) {
      console.error(`Storybook exited with code ${code}`);
      process.exit(code);
    }

    console.log('Storybook closed');
    process.exit(0);
  });

  // Handle termination signals
  process.on('SIGINT', () => {
    console.log('Shutting down Storybook...');
    storybook.kill();
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down Storybook...');
    storybook.kill();
  });
}

// Start the script
startStorybook().catch((err) => {
  console.error('Failed to start Storybook:', err);
  process.exit(1);
});
