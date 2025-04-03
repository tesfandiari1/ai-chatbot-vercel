#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// Get command line arguments
const args = process.argv.slice(2);
const fullClean = args.includes('--full');

console.log('Cleaning project...');

// Directories to clean
const dirsToRemove = [
  '.next',
  '.vercel',
  'node_modules/.cache',
  'public/styles', // Generated CSS files
];

// Add node_modules to full clean
if (fullClean) {
  dirsToRemove.push('node_modules');
  console.log('Performing full clean including node_modules');
}

// Remove directories
dirsToRemove.forEach((dir) => {
  const dirPath = path.join(process.cwd(), dir);

  if (fs.existsSync(dirPath)) {
    console.log(`Removing ${dir}`);
    try {
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'inherit' });
      } else {
        execSync(`rm -rf "${dirPath}"`, { stdio: 'inherit' });
      }
    } catch (error) {
      console.error(`Error removing ${dir}:`, error.message);
    }
  }
});

// Recreate public/styles directory to avoid build errors
const stylesDir = path.join(process.cwd(), 'public/styles');
if (!fs.existsSync(stylesDir)) {
  console.log('Creating public/styles directory');
  fs.mkdirSync(stylesDir, { recursive: true });
}

console.log('Cleaning complete!');

// Remind to run npm install after full clean
if (fullClean) {
  console.log('\nRemember to run "pnpm install" to reinstall dependencies');
}
