#!/usr/bin/env node

/**
 * Clean Project Script
 *
 * This script helps clean the project when encountering build issues.
 * It removes build caches, node_modules (optionally), and temporary files.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Get project root
const rootDir = path.resolve(__dirname, '../../');

// Paths to clean
const pathsToClean = [
  '.next',
  'node_modules/.cache',
  '.turbo',
  'logs',
  'test-results',
];

// Parse command line args
const args = process.argv.slice(2);
const fullClean = args.includes('--full');

if (fullClean) {
  pathsToClean.push('node_modules');
}

console.log('🧹 Cleaning project...');
console.log(`🔍 Running ${fullClean ? 'FULL' : 'STANDARD'} clean\n`);

// Clean paths
pathsToClean.forEach((relativePath) => {
  const fullPath = path.join(rootDir, relativePath);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing: ${relativePath}`);
    try {
      execSync(`rm -rf "${fullPath}"`);
    } catch (error) {
      console.error(`Failed to remove ${relativePath}: ${error.message}`);
    }
  }
});

console.log('\n✅ Clean completed!');

if (fullClean) {
  console.log('\n🔄 Reinstalling dependencies...');
  try {
    execSync('pnpm install', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Dependencies reinstalled successfully!');
  } catch (error) {
    console.error(`❌ Failed to reinstall dependencies: ${error.message}`);
    process.exit(1);
  }
}

console.log('\n🚀 Project is ready for development!');
console.log('Run `pnpm dev` to start the development server.');
