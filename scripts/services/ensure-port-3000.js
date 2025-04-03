#!/usr/bin/env node
// ES Module Script
import { exec } from 'node:child_process';
import process from 'node:process';

const PORT = 3000;

console.log(`Checking if port ${PORT} is available...`);

// Different commands for different platforms
const cmd =
  process.platform === 'win32'
    ? `netstat -ano | findstr :${PORT}`
    : `lsof -i:${PORT}`;

exec(cmd, (error, stdout, stderr) => {
  if (stdout) {
    console.error(`\x1b[31mError: Port ${PORT} is already in use!\x1b[0m`);
    console.error(
      `Please stop any processes using port ${PORT} before starting the development server.`,
    );
    console.error('You can try:');
    if (process.platform === 'win32') {
      console.error(`  1. Run Command Prompt as Administrator`);
      console.error(`  2. Execute: netstat -ano | findstr :${PORT}`);
      console.error(`  3. Find the PID (Process ID) in the last column`);
      console.error(`  4. Execute: taskkill /F /PID <PID>`);
    } else {
      console.error(`  1. Execute: lsof -i:${PORT}`);
      console.error(`  2. Find the PID (Process ID) in the second column`);
      console.error(`  3. Execute: kill -9 <PID>`);
    }
    process.exit(1);
  } else {
    console.log(`Port ${PORT} is available. Starting server...`);
    process.exit(0);
  }
});
