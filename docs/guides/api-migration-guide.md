# API Migration Guide

This guide helps developers adapt their code to the new App Router API structure.

## Overview of Changes

We've migrated from the Next.js Pages Router API structure (`pages/api/*`) to the App Router structure (`app/api/*`). This change brings several benefits but requires some code adjustments.

## Key Differences

| **Pages Router (Old)** | **App Router (New)** | **Notes** |
|------------------------|----------------------|-----------|
| `pages/api/route.js` | `app/api/route.ts` | Directory structure changed |
| `export default function handler(req, res)` | `export async function GET(request)` | Separate functions per HTTP method |
| `res.status(200).json({ data })` | `return NextResponse.json({ data })` | Different response pattern |
| `req.query`, `req.body` | `request.nextUrl.searchParams`, `await request.json()` | Different request handling |
| Uses Node.js runtime by default | Can specify runtime (Node.js or Edge) | More deployment options |

## Step-by-Step Migration

### 1. Client Code Changes

If your client-side code calls API endpoints, the URLs remain the same (`/api/route`), but ensure:

```typescript
// Old pattern
const response = await fetch('/api/test-redis');
const data = await response.json();

// New pattern - similar, but might need error handling adjustments
const response = await fetch('/api/test-redis');
if (!response.ok) {
  throw new Error(`API error: ${response.status}`);
}
const data = await response.json();
```

### 2. Server Code Changes

#### Route Handler Conversion

```typescript
// OLD (pages/api/example.ts)
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Handle GET
    return res.status(200).json({ data: 'example' });
  } else if (req.method === 'POST') {
    // Handle POST
    const body = req.body;
    return res.status(200).json({ received: body });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// NEW (app/api/example/route.ts)
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // If needed

export async function GET(request: NextRequest) {
  // Handle GET
  return NextResponse.json({ data: 'example' });
}

export async function POST(request: NextRequest) {
  // Handle POST
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

#### Request Parameters

```typescript
// OLD
const { query } = req.query;
const { name } = req.body;

// NEW
const query = request.nextUrl.searchParams.get('query');
const { name } = await request.json(); // For POST/PUT requests
```

#### Setting Headers

```typescript
// OLD
res.setHeader('Content-Type', 'application/json');
res.status(200).json({ data });

// NEW
return new NextResponse(JSON.stringify({ data }), {
  status: 200,
  headers: {
    'Content-Type': 'application/json'
  }
});
// Or more simply:
return NextResponse.json({ data }, {
  headers: {
    'Custom-Header': 'value'
  }
});
```

### 3. Environment Variables

We now use `.env.local` as the single source of truth for environment variables:

```
# .env.local
KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token
```

### 4. Authentication

If using NextAuth.js, ensure you've updated to version 5 which has been adapted for App Router:

```typescript
// OLD
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ...
}

// NEW
import { auth } from '@/auth';

export async function GET(request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

## Testing Your Changes

After migrating your code:

1. Run the development server: `pnpm dev`
2. Test each API endpoint with tools like Postman or curl
3. Verify client-side interactions are working correctly
4. Check authentication flows still function as expected

## Resources

- [Next.js Route Handlers Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Request & Response Types](https://nextjs.org/docs/app/api-reference/functions/next-request)
- [App Router API Structure Documentation](../architecture/api-structure.md)

If you encounter any issues during migration, refer to the troubleshooting section in the API structure documentation or reach out to the development team. 