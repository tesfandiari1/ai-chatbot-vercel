# Scripts Directory

This directory contains various utility scripts for the project, organized by their purpose.

## Directory Structure

```
scripts/
├── services/           # Service management scripts
│   ├── ensure-port-3000.js   # Port management utility
│   ├── service-manager.js    # Service checker and manager
│   ├── start-app.js          # Application starter
│   └── README.md             # Service manager documentation
├── testing/            # Testing-related scripts
│   ├── test-mcp-endpoint.js  # MCP endpoint testing
│   ├── test-redis.js         # Redis testing utility
│   └── test-redis-simple.js  # Simplified Redis testing
├── database/           # Database-related scripts
│   ├── fix-db.js             # Database repair utility
│   ├── migrate-inside-container.js  # Container migration utility
│   ├── run-migrations.js     # Migration runner
│   └── setup-postgres.js     # PostgreSQL setup utility
├── deployment/         # Deployment and setup scripts
│   ├── local-deploy.js       # Local deployment utility
│   └── check-ports.js        # Port checker
├── mcp/                # MCP-related scripts
│   ├── start-mcp-server.js   # MCP server starter
│   └── test-mcp-local.js     # MCP local testing
├── storybook/          # Storybook-related scripts
│   └── storybook-start.js    # Storybook starter
├── config/             # Configuration files
│   └── vitest.config.ts      # Vitest configuration
└── README.md           # This file
```

## Usage

Most of these scripts can be run via npm scripts defined in package.json:

```bash
# Service management
npm run services           # Check all services
npm run services:check     # Check services status
npm run services:start     # Start all services

# Development
npm run dev                # Start Next.js development server
npm run dev:all            # Start Next.js and MCP
npm run dev:force3000      # Force Next.js to run on port 3000
npm run dev:complete       # Complete development setup

# Database
npm run db:migrate         # Run database migrations
npm run db:studio          # Open database studio
npm run db:check           # Check database status

# Testing
npm test                   # Run tests
```

## Scripts Overview

### Service Management
- **service-manager.js**: Checks the status of required services (Next.js, Redis, PostgreSQL, Storybook)
- **ensure-port-3000.js**: Makes sure port 3000 is available for Next.js
- **start-app.js**: Coordinates service startup

### Database
- **fix-db.js**: Utility to repair database issues
- **run-migrations.js**: Runs database migrations
- **migrate-inside-container.js**: Used for running migrations in Docker containers
- **setup-postgres.js**: Sets up PostgreSQL with proper configuration

### Deployment
- **local-deploy.js**: Comprehensive script for local deployment
- **check-ports.js**: Utility to check if ports are in use

### MCP (Model Context Protocol)
- **start-mcp-server.js**: Starts the MCP server
- **test-mcp-local.js**: Tests MCP functionality locally

### Storybook
- **storybook-start.js**: Starts the Storybook UI component explorer 