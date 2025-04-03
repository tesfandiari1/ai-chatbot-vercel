#!/usr/bin/env node
import { spawn, exec } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import http from 'node:http';
import next from 'next';
import { fileURLToPath } from 'node:url';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.MCP_SERVER_PORT
  ? Number.parseInt(process.env.MCP_SERVER_PORT, 10)
  : 8000;
const MCP_PATH = '/api/mcp/server';

// Helper for console output with timestamps
const timestamp = () => new Date().toISOString();
const log = (message) => console.log(`[${timestamp()}] ${message}`);
const error = (message) => console.error(`[${timestamp()}] ERROR: ${message}`);

// Load environment variables from .env.local
async function loadEnvVars() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = await fs.readFile(envPath, 'utf8');

    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].replace(/^["']|["']$/g, '').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });

    log('Environment variables loaded from .env.local');
  } catch (err) {
    error(`Failed to load environment variables: ${err.message}`);
  }
}

// Start the MCP server
async function startMcpServer() {
  // Load environment variables
  await loadEnvVars();

  log(`Starting MCP server on port ${PORT}...`);

  // Create a minimal Next.js app just for the API route
  const app = next({
    dev: true,
    dir: process.cwd(),
  });

  const handle = app.getRequestHandler();

  try {
    await app.prepare();
    log('Next.js app prepared successfully');

    // Create and start an HTTP server
    const server = http.createServer(async (req, res) => {
      // Special handling for the MCP endpoint to map from /api/mcp/server to http://localhost:8000
      if (req.url.startsWith(MCP_PATH)) {
        log(`MCP request received: ${req.method} ${req.url}`);
        await handle(req, res);
        return;
      }

      // For any other requests, just return a simple message
      if (req.url === '/') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(`
          <html>
            <head><title>MCP Server</title></head>
            <body>
              <h1>MCP Server</h1>
              <p>MCP server is running on port ${PORT}</p>
              <p>Endpoint: http://localhost:${PORT}${MCP_PATH}</p>
            </body>
          </html>
        `);
        return;
      }

      // Handle all other requests through Next.js
      await handle(req, res);
    });

    // Start the server
    server.listen(PORT, (err) => {
      if (err) throw err;
      log(`MCP server is now running at http://localhost:${PORT}`);
      log(`MCP endpoint available at http://localhost:${PORT}${MCP_PATH}`);
    });

    // Handle server shutdown
    process.on('SIGINT', () => {
      log('Shutting down MCP server...');
      server.close(() => {
        log('MCP server shut down successfully');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      log('Shutting down MCP server...');
      server.close(() => {
        log('MCP server shut down successfully');
        process.exit(0);
      });
    });
  } catch (err) {
    error(`Failed to start MCP server: ${err.message}`);
    process.exit(1);
  }
}

// Run the server
startMcpServer();
