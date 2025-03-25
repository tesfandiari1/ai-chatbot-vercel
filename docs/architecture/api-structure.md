# API Structure

This document describes the API structure of the application after the refactoring from Pages Router to App Router.

## Overview

We've migrated from the legacy Next.js Pages Router API structure to the modern App Router structure, which provides better performance, more intuitive routing, and improved server component capabilities.

## Directory Structure

The API routes are now organized in the `app/api` directory following the App Router conventions:

```
app/
├── api/
│   ├── mcp/
│   │   └── server/
│   │       └── route.ts     # MCP server implementation
│   ├── test-redis/
│   │   └── route.ts         # Redis test endpoint
│   ├── files/
│   │   └── upload/
│   │       └── route.ts     # File upload endpoint
│   └── vote/
│       └── route.ts         # Message voting endpoint
```

## Key API Endpoints

### MCP Server (`/api/mcp/server`)

The Model Context Protocol server API provides standardized context for LLMs, including:

- **Tools**: Functions that can be called by the LLM to perform actions
- **Resources**: Data sources that can be fetched and included in LLM context
- **Capabilities**: Dynamic information about available tools and resources

### Redis Test (`/api/test-redis`)

A simple endpoint to verify Redis connectivity, which is critical for the MCP server's state management.

## API Route Implementation

All API routes now use the App Router format with exported HTTP method handlers:

```typescript
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Optional, depending on route needs

export async function GET(request: NextRequest) {
  // Handle GET requests
  return NextResponse.json({ data: 'response' });
}

export async function POST(request: NextRequest) {
  // Handle POST requests
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

## Client-Side Integration

Client components interact with these API routes using standard fetch calls or through utility functions:

```typescript
// Example of calling the MCP server
const response = await fetch('/api/mcp/server', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'tool_call',
    tool: 'echo',
    arguments: { message: 'Hello, world!' }
  })
});
```

## Environment Configuration

API endpoints access environment variables through `process.env` in server components:

- Redis credentials are accessed through standardized environment variables
- The application looks for both `KV_REST_API_*` and `UPSTASH_REDIS_*` formats for Redis credentials
- All environment variables should be defined in `.env.local` for development

## Reduced Redundancy

As part of the refactoring:

1. Removed redundant API implementations
2. Consolidated environment configuration
3. Eliminated duplicate utility files
4. Streamlined middleware implementations
5. Improved error handling across all API routes

## Testing API Endpoints

To test API endpoints locally:

1. Start the development server: `pnpm dev`
2. Use curl or Postman to make requests to `http://localhost:3000/api/...`
3. For authenticated endpoints, you'll need to include proper session cookies

Example Redis test:

```bash
curl -v http://localhost:3000/api/test-redis
```

## Performance Benefits

The migration to App Router APIs provides several performance improvements:

1. **Route Handlers**: More efficient handling of API requests with reduced overhead
2. **Server-Side Rendering**: Better integration with React Server Components
3. **Streaming**: Support for response streaming where appropriate
4. **Edge Runtime Support**: Option to deploy API routes to the Edge (closer to users)
5. **Reduced Client JS**: Smaller bundle sizes with server-focused code execution

## Migration Guidance for Developers

When working with the refactored codebase, keep these guidelines in mind:

### Do's:
- Use the new App Router route handler pattern with exported HTTP methods
- Keep server-side logic in the route handlers
- Leverage TypeScript for request and response types
- Use `NextResponse` for standardized API responses
- Take advantage of server-side caching where appropriate

### Don'ts:
- Don't create API routes using the old Pages Router pattern (`pages/api/...`)
- Avoid mixing client-side and server-side code in API routes
- Don't use `res.status().json()` pattern from Express-style handlers
- Avoid direct database access in client components (use API routes instead)

## Troubleshooting

Common issues you might encounter when working with the refactored API routes:

1. **Authentication Issues**: Make sure you're handling authentication correctly with the new route patterns
2. **CORS Errors**: Set proper headers in your route handlers for cross-origin requests
3. **Type Errors**: Ensure you're using the correct types from Next.js (`NextRequest`, `NextResponse`)
4. **Environment Variables**: Server components can access environment variables directly, but client components cannot
5. **Caching Behavior**: Be aware of the default caching behavior and use `dynamic = 'force-dynamic'` when needed

For more detailed information on Next.js App Router API routes, refer to the [official documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers).