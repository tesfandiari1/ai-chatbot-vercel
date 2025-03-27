# Calendar Scheduling with Google Calendar: Implementation Plan

This document outlines the plan to implement the calendar scheduling feature in our Vercel AI chatbot application using the Google Calendar API through Composio.

## Progress Update

We've implemented the core infrastructure needed for the calendar scheduling feature:

1. Added Google OAuth provider to NextAuth
2. Created Composio entity and connection management
3. Updated the database schema to store Composio connection IDs
4. Implemented proper tools for calendar operations
5. Added authentication verification endpoint

These changes allow the calendar artifact to properly authenticate with Google Calendar and use Composio for calendar operations.

## Implementation Checklist

### 1. Authentication Setup

- [x] Configure Google OAuth provider in NextAuth
  - [x] Add Google provider to app/(auth)/api/auth/[...nextauth]/route.ts
  - [x] Configure proper scopes for Calendar API access
  - [x] Ensure redirect URIs are correctly set up

- [x] Create Google Calendar callback handler
  - [x] Implement /app/api/auth/callback/google/route.ts
  - [x] Handle OAuth state validation and token exchange

### 2. Composio Integration

- [x] Set up Composio configuration
  - [x] Ensure COMPOSIO_API_KEY is configured in environment
  - [x] Create Composio toolset initialization in lib/composio/config.ts

- [x] Implement entity and connection flow
  - [x] Create entity for current user
  - [x] Implement initiateConnection for Google Calendar
  - [x] Add waitUntilActive flow to handle connection state

### 3. Calendar Artifact

- [x] Update artifact structure
  - [x] Ensure artifacts/calendar/client.tsx follows Artifact pattern
  - [x] Verify artifacts/calendar/server.ts uses createDocumentHandler
  - [x] Check artifacts/calendar/types.ts has proper type definitions

- [x] Register artifact in the system
  - [x] Add calendarDocumentHandler to documentHandlersByArtifactKind
  - [x] Add 'calendar' to artifactKinds const
  - [x] Add 'calendar' to document schema enum
  - [x] Add calendarArtifact to artifactDefinitions array

### 4. Calendar API Integration

- [x] Implement calendar tools
  - [x] Create function to check calendar availability
  - [x] Create function to schedule meetings
  - [x] Add helper functions for date/time handling

- [x] Connect calendar tools to Composio
  - [x] Ensure proper error handling
  - [x] Add logging for debugging
  - [ ] Implement retry mechanisms

## Implementation Details

### NextAuth Google Provider Configuration

```typescript
// In app/(auth)/auth.ts
import GoogleProvider from "next-auth/providers/google";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({...}),
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events openid email profile"
        }
      }
    }),
  ],
  // Rest of config...
});
```

### Composio Entity and Connection Flow

```typescript
// In lib/composio/calendar.ts
export async function getCalendarConnection(userId: string) {
  try {
    // Create or get entity for user
    const entity = await composioToolset.getEntity(userId);
    
    // Check if user already has a connection
    const connections = await entity.getConnections();
    const calendarConn = connections.find(c => c.appName === "googlecalendar");
    
    // Check if connection exists and is active
    if (calendarConn?.status === "active") {
      return {
        isActive: true,
        connectionId: calendarConn.id,
      };
    }
    
    // Initiate new connection
    const connReq = await entity.initiateConnection({
      appName: "googlecalendar",
    });
    
    return {
      isActive: false,
      redirectUrl: connReq.redirectUrl,
      waitForConnection: async () => {
        return await connReq.waitUntilActive(20);
      }
    };
  } catch (error) {
    console.error('Error getting calendar connection:', error);
    // Fallback handling...
  }
}
```

### Artifact Registration

The calendar artifact is properly registered in the system:

```typescript
// In lib/artifacts/server.ts
export const documentHandlersByArtifactKind: Array<DocumentHandler> = [
  textDocumentHandler,
  codeDocumentHandler,
  imageDocumentHandler,
  sheetDocumentHandler,
  calendarDocumentHandler,
];

export const artifactKinds = [
  'text',
  'code',
  'image',
  'sheet',
  'calendar',
] as const;

// In components/artifact.tsx
export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
  calendarArtifact,
];
```

## Next Steps

After implementing all the items in the checklist:

1. Test the flow in development environment
   - Test authentication with Google OAuth
   - Test calendar availability checking
   - Test meeting creation

2. Add error handling for common scenarios
   - Authentication failures
   - Connection timeouts
   - Permission issues

3. Implement user-friendly UI feedback during authentication
   - Add loading indicators during auth flow
   - Show clear error messages when needed

4. Document the feature for end-users
   - Create user guide for calendar scheduling
   - Update documentation with setup instructions

5. Launch the feature in production 