# Service Manager

This script helps you check and manage the services required for the AI Chatbot application.

## Services Monitored

- **Next.js** development server (port 3000)
- **Redis** server (port 6379) 
- **PostgreSQL** database (port 5432)
- **Storybook** (port 6006)

## Usage

```bash
# Install dependencies (if not already installed)
pnpm install

# Run the service manager
pnpm services

# To ensure Next.js runs specifically on port 3000
pnpm dev:force3000

# To check and start all services (Next.js, Redis, PostgreSQL, MCP)
pnpm dev:complete
```

## Features

- Checks if each service is running
- Displays the port and status of each service
- Provides detailed connection errors (if any)
- Allows you to start missing services
- Starts services in detached mode so they continue running after the script exits
- **Automatically frees port 3000** if it's in use to ensure Next.js always runs on port 3000
- **Validates Redis configuration** for MCP integration
- **Validates PostgreSQL connection** and attempts to start the service if needed
- **Platform-aware PostgreSQL management** with support for macOS, Linux and Windows

## PostgreSQL Integration

The application includes enhanced PostgreSQL integration:

1. **Automatic connection testing** to verify database connectivity
2. **Platform detection** to use the appropriate commands on different operating systems
3. **Auto-recovery** that attempts to start PostgreSQL if it's not running
4. **Clear error reporting** with detailed diagnostics

### PostgreSQL Scripts

```bash
# Validate PostgreSQL and start if necessary
pnpm services:start

# Check database migration status
pnpm db:check

# Run database migrations
pnpm db:migrate

# Open interactive database studio
pnpm db:studio
```

## Port 3000 Enforcement

The application now includes several mechanisms to ensure Next.js always runs on port 3000:

1. **ensure-port-3000.js**: Script that checks if port 3000 is in use and frees it
2. **start-app.js**: Comprehensive starter that ensures port 3000 and starts both Next.js and MCP
3. **Updated service-manager.js**: Automatically kills processes on port 3000 instead of finding alternative ports

### Available Scripts

```bash
# Standard development with port 3000 enforcement
pnpm dev

# Run Next.js and MCP server together
pnpm dev:all

# Force port 3000 and start both Next.js and MCP with colored output
pnpm dev:force3000

# Complete development setup (includes PostgreSQL validation)
pnpm dev:complete

# Start production server on port 3000
pnpm start

# Start MCP server only
pnpm start:mcp

# Start both production server and MCP
pnpm start:all
```

## Requirements

Make sure your environment variables are set up correctly. The script will look for:

- `REDIS_URL` - Default: redis://localhost:6379
- `POSTGRES_URL` - Required for PostgreSQL connection
- `KV_REST_API_URL` - Required for MCP Redis integration
- `KV_REST_API_TOKEN` - Required for MCP Redis integration

## Service Configuration

If you need to customize service ports or commands, modify the `SERVICES` object in `service-manager.js`:

```javascript
const SERVICES = {
  NEXT: { name: 'Next.js', port: 3000, defaultCommand: 'pnpm dev -p 3000' },
  REDIS: { name: 'Redis', port: 6379, defaultCommand: 'redis-server' },
  POSTGRES: { name: 'PostgreSQL', port: 5432 },
  STORYBOOK: { name: 'Storybook', port: 6006, defaultCommand: 'node storybook-start.js' }
};
```

## Troubleshooting

If a service fails to start:

1. Check the error message displayed by the script
2. Verify your environment variables in `.env.local`
3. Try starting the service manually using the commands in the script
4. Check logs for detailed error information (usually in the `logs/` directory)
5. If port 3000 is still in use, manually kill the process:
   ```bash
   # On macOS/Linux
   lsof -i :3000 -t | xargs kill -9
   
   # On Windows
   FOR /F "tokens=5" %P IN ('netstat -aon | findstr :3000') DO TaskKill /PID %P /F
   ```

### PostgreSQL-Specific Troubleshooting

If PostgreSQL fails to connect:

1. Check if PostgreSQL is installed on your system
2. Verify the `POSTGRES_URL` environment variable is correctly formatted:
   ```
   postgresql://username:password@localhost:5432/database_name
   ```
3. Ensure the PostgreSQL service is running:
   ```bash
   # macOS
   brew services list
   brew services start postgresql
   
   # Linux
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   
   # Windows
   net start | findstr Post
   net start postgresql
   ```
4. Check if the database exists and you have permission to access it 