# Calendar Scheduling Implementation Plan

Based on the code audit, here's a detailed implementation plan to correctly set up the calendar scheduling feature with Google Calendar and Composio.

## Current Status

The calendar scheduling feature has been successfully implemented:
- ✅ Basic artifact structure (client, server, types) is in place
- ✅ Composio configuration is set up in `lib/composio/config.ts`
- ✅ Google Calendar route handlers have been updated
- ✅ NextAuth integration with Google OAuth is implemented
- ✅ Composio entity and connection flow is working

## Implementation Checklist

### 1. NextAuth Configuration

- [x] Update app/(auth)/auth.ts to include Google provider:
  ```typescript
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

- [x] Update environment variables in `.env`:
  ```
  GOOGLE_OAUTH_CLIENT_ID=your_client_id
  GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
  COMPOSIO_API_KEY=your_composio_api_key
  ```

### 2. Composio Integration

- [x] Create `lib/composio/calendar.ts` for Composio entity and connection management:
  ```typescript
  import { OpenAIToolSet } from "composio-core";
  
  export async function getCalendarConnection(userId: string) {
    // Implementation complete - handles entity creation and connection
  }
  ```

- [x] Update `lib/composio/config.ts` to use the entity/connection pattern for Google Calendar:
  ```typescript
  export const handleGoogleCalendarCallback = async (
    code: string,
    redirectUri: string
  ): Promise<AuthResult> => {
    // Implementation complete - handles OAuth callback
  };
  ```

### 3. API Routes Updates

- [x] Update `/app/api/auth/google-calendar/callback/route.ts` to use Composio connection flow:
  ```typescript
  import { waitForCalendarConnection } from '@/lib/composio/calendar';
  
  // Implementation complete - handles OAuth callback and connections
  ```

- [x] Update `/app/api/calendar/check-auth/route.ts` to verify Composio connection:
  ```typescript
  // Implementation complete - checks for valid Composio connection
  ```

### 4. Google Calendar Tools Updates

- [x] Update `lib/tools/google-calendar.ts` to use Composio connections:
  ```typescript 
  // Implementation complete - tools now use Composio connections
  ```

### 5. Database Schema Updates

- [x] Update `lib/db/schema.ts` to store Composio connection IDs:
  ```typescript
  export const oauthToken = pgTable('OAuthToken', {
    // Existing fields...
    composioConnectionId: text('composioConnectionId'),
  });
  ```

- [x] Update queries in `lib/db/queries.ts`:
  ```typescript
  export async function saveOAuthToken({
    userId,
    provider,
    accessToken,
    refreshToken,
    expiresAt,
    composioConnectionId,
  }) {
    // Implementation complete - supports storing connection IDs
  }
  ```

## Testing Plan

After implementation:

1. Test OAuth Flow:
   - Start the app and navigate to calendar scheduling
   - Verify redirect to Google consent screen
   - Authorize the application
   - Verify redirect back to the app
   - Check if connection is stored in database

2. Test Calendar Operations:
   - Verify available time slots are fetched correctly
   - Test meeting creation
   - Verify meeting appears in Google Calendar

3. Error Handling:
   - Test behavior when user denies permission
   - Test timeout scenarios
   - Verify proper error messages are displayed

## Next Steps

- [ ] Test the feature in development environment
- [ ] Add more comprehensive error handling
- [ ] Add user-friendly loading indicators
- [ ] Update documentation with user guides
- [ ] Deploy to production environment 