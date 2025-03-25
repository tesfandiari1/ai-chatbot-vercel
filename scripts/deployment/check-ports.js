#!/usr/bin/env node
const net = require('node:net');

const portsToCheck = [
  { port: 3000, service: 'Next.js' },
  { port: 6006, service: 'Storybook' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 6379, service: 'Redis' },
  { port: 8000, service: 'MCP Server' },
];

// Helper to check if a port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
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

// Main function to check all ports
const checkAllPorts = async () => {
  console.log('Checking port availability for services...\n');

  const results = [];
  let hasBlockedPorts = false;

  for (const { port, service } of portsToCheck) {
    const inUse = await isPortInUse(port);
    results.push({ port, service, inUse });

    if (inUse) {
      hasBlockedPorts = true;
    }
  }

  // Display results
  console.log('Port Status:');
  console.log('===========');

  for (const { port, service, inUse } of results) {
    console.log(
      `${port.toString().padEnd(6)} ${service.padEnd(15)} ${inUse ? '🔴 IN USE' : '🟢 AVAILABLE'}`,
    );
  }

  console.log('\n');

  if (hasBlockedPorts) {
    console.log('Some ports are already in use. You have these options:');
    console.log('1. Stop the services using these ports');
    console.log('2. Use the --dev flag with alternative ports:');
    console.log('   pnpm deploy:local:dev -- --skip-redis --skip-postgres\n');

    console.log('To find processes using these ports on Mac/Linux:');
    for (const { port, service, inUse } of results) {
      if (inUse) {
        console.log(`- For ${service} (port ${port}): lsof -i :${port}`);
      }
    }
  } else {
    console.log('All ports are available! You can run:');
    console.log('pnpm deploy:local:dev\n');
  }
};

// Run the port check
checkAllPorts();
