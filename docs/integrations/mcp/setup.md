# Setting Up Redis for MCP Integration

This document outlines the steps required to set up a Redis instance for our MCP (Model Context Protocol) integration.

## Overview

MCP requires a Redis database for state management and to maintain persistent connections. We'll use Vercel KV (powered by Upstash), which is the recommended Redis solution for Vercel deployments.

## Step 1: Add Upstash Integration to Vercel Project

1. Go to the [Upstash Integration on Vercel](https://vercel.com/marketplace/upstash)
2. Click the "Add Integration" button
3. Choose the scope (personal or team)
4. Select your Vercel project
5. Authorize the integration

## Step 2: Set Up Redis Database

1. After authorization, you'll be redirected to Upstash
2. Select your Vercel project from the dropdown
3. Choose to create a new Redis database:
   - Select region (choose one closest to your Vercel deployment)
   - Choose a name for your database
   - Select the appropriate plan (Free tier is sufficient for initial development)
4. Click "Create" to provision the database

## Step 3: Environment Variables

After creating the database, Upstash will automatically:
1. Add the following environment variables to your Vercel project:
   - `UPSTASH_REDIS_REST_URL`: The REST API endpoint URL
   - `UPSTASH_REDIS_REST_TOKEN`: Authorization token for the REST API

2. You'll need to redeploy your application for the environment variables to take effect.

## Step 4: Update Local Environment

For local development, add these variables to your `.env.local` file:

```
# Redis Configuration
KV_REST_API_URL=your_upstash_redis_rest_url
KV_REST_API_TOKEN=your_upstash_redis_rest_token

# Alternatively, the application will also check for these variables:
# UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
# UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

Note: We prefer using a single `.env.local` file rather than multiple environment files to avoid redundancy. This file is gitignored and should not be committed to the repository.

## Step 5: Update MCP Configuration

We need to update our MCP configuration to use the Upstash Redis connection:

1. Our application follows the Next.js App Router structure with API routes located in `app/api/`:
   ```
   app/
   ├── api/
   │   ├── mcp/
   │   │   └── server/
   │   │       └── route.ts   # MCP server implementation
   │   └── test-redis/
   │       └── route.ts       # Redis test endpoint
   ```

2. The MCP client is configured in `lib/mcp/client.ts` and points to the correct API endpoint:
   ```typescript
   export function createMcpClient(options: MCPClientOptions = {}) {
     const serverUrl =
       options.serverUrl || process.env.MCP_SERVER_URL || '/api/mcp/server';
     // ... rest of the implementation
   }
   ```

## Step 6: Testing the Connection

To verify that your Redis connection is working:

1. Add a simple test route in `app/api/test-redis/route.ts`:
   ```typescript
   import { type NextRequest, NextResponse } from 'next/server';
   import { Redis } from '@upstash/redis';
   
   export const runtime = 'nodejs';
   
   export async function GET(request: NextRequest) {
     try {
       const restApiUrl = 
         process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
       const restApiToken = 
         process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
       
       if (!restApiUrl || !restApiToken) {
         return NextResponse.json(
           { 
             success: false, 
             error: 'Redis credentials are not configured.' 
           }, 
           { status: 500 }
         );
       }
       
       const redis = new Redis({
         url: restApiUrl,
         token: restApiToken,
       });
       
       await redis.set("test-key", "Hello from MCP!");
       const value = await redis.get("test-key");
       
       return NextResponse.json({ success: true, value });
     } catch (error) {
       console.error('Redis test error:', error);
       return NextResponse.json(
         { 
           success: false, 
           error: error instanceof Error ? error.message : 'Failed to connect to Redis'
         }, 
         { status: 500 }
       );
     }
   }
   ```

2. Access the route at `/api/test-redis` in your browser to check if Redis is working properly

## Resources

- [Upstash Documentation](https://upstash.com/docs/redis/howto/vercelintegration)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [MCP TypeScript SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk) 