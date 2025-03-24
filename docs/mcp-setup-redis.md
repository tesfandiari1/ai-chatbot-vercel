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

## Step 4: Update MCP Configuration

We need to update our MCP configuration to use the Upstash Redis connection:

1. Add the following to `.env.local` for local development:
   ```
   REDIS_URL=your_upstash_redis_rest_url
   ```

2. Modify `lib/mcp/mcp-api-handler.ts` to use the Upstash Redis client if needed:
   ```typescript
   import { Redis } from "@upstash/redis";
   
   // Instead of:
   const redis = createClient({
     url: redisUrl,
   });
   
   // You might use:
   const redis = Redis.fromEnv();
   ```

## Step 5: Testing the Connection

To verify that your Redis connection is working:

1. Add a simple test route in `api/test-redis.ts`:
   ```typescript
   import { Redis } from "@upstash/redis";
   
   export default async function handler(req, res) {
     try {
       const redis = Redis.fromEnv();
       await redis.set("test-key", "Hello from MCP!");
       const value = await redis.get("test-key");
       
       res.status(200).json({ success: true, value });
     } catch (error) {
       res.status(500).json({ 
         success: false, 
         error: error.message || "Failed to connect to Redis" 
       });
     }
   }
   ```

2. Access the route in your browser to check if Redis is working properly

## Resources

- [Upstash Documentation](https://upstash.com/docs/redis/howto/vercelintegration)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [MCP TypeScript SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk) 