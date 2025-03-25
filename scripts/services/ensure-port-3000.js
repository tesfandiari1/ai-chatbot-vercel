#!/usr/bin/env node
const { execSync } = require('node:child_process');
const net = require('node:net');

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

// Kill processes using port 3000
function killPort3000Process() {
  try {
    // For macOS/Linux
    if (process.platform !== 'win32') {
      console.log('Attempting to kill process on port 3000...');
      execSync('lsof -i :3000 -t | xargs kill -9', { stdio: 'ignore' });
    } else {
      // For Windows
      console.log('Attempting to kill process on port 3000...');
      execSync(
        'FOR /F "tokens=5" %P IN (\'netstat -aon ^| findstr :3000\') DO TaskKill /PID %P /F',
        {
          stdio: 'ignore',
          shell: true,
        },
      );
    }
    console.log('Successfully freed port 3000');
  } catch (error) {
    console.log(
      'No process was running on port 3000 or failed to kill process',
    );
  }
}

// Main function
async function ensurePort3000Available() {
  console.log('Checking if port 3000 is available...');

  if (await isPortInUse(3000)) {
    console.log('Port 3000 is currently in use');
    killPort3000Process();

    // Check again after killing
    if (await isPortInUse(3000)) {
      console.error(
        'Failed to free port 3000. Please manually close the application using it.',
      );
      process.exit(1);
    }
  } else {
    console.log('Port 3000 is available');
  }

  console.log('Ready to start application on port 3000');
}

// Run the check
ensurePort3000Available().catch((error) => {
  console.error('Error checking port availability:', error);
  process.exit(1);
});
