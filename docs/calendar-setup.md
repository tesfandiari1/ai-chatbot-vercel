# Calendar Scheduling Feature: Implementation Guide

This guide provides instructions for integrating the calendar scheduling feature in your AI chatbot application.

## Feature Overview

The calendar scheduling feature allows users to:
1. Select a date from a calendar view
2. Choose from available time slots
3. Enter meeting details (name, email, title, notes)
4. Create a meeting in Google Calendar

## Implementation Requirements

1. **Google OAuth Configuration**
   - Google Cloud Console project with Calendar API enabled
   - OAuth credentials (Client ID and Secret)
   - Properly configured redirect URIs:
     - `https://backend.composio.dev/api/v1/auth-apps/add` (for Composio)
     - `http://localhost:3000/api/auth/callback/google` (for local development)
     - Your production domain redirect URI (e.g., `https://yourdomain.com/api/auth/callback/google`)

2. **Composio Integration**
   - Composio API key for accessing Google Calendar tools
   - Entity and connection management for user authentication

3. **Artifact Implementation**
   - Calendar artifact with client and server components
   - Proper registration in the artifact system

## Implementation Status

The calendar scheduling feature has been successfully implemented:
- ✅ Google OAuth provider added to NextAuth
- ✅ Composio entity and connection flow implemented
- ✅ Database schema updated to store connection IDs
- ✅ Calendar artifact structure properly registered
- ✅ Calendar API tools using Composio connections

## Environment Variables

```
COMPOSIO_API_KEY=your_composio_api_key
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
```

## Testing the Integration

After implementation, verify the integration works correctly:
1. Start a conversation with the AI chatbot
2. Request to schedule a meeting
3. Follow the calendar scheduling flow:
   - Select a date
   - Choose an available time slot
   - Enter meeting details
4. Authorize with Google (if not already connected)
5. Confirm the event appears in Google Calendar

## Authentication Flow

When a user first tries to use the calendar scheduling feature:
1. The system will check if they have an active Composio connection
2. If not, they will be prompted to connect their Google Calendar
3. After authentication, Composio will handle the OAuth flow and store the connection
4. Subsequent calendar operations will use this authenticated connection

## Next Steps

1. Test the feature in development environment
2. Add more comprehensive error handling
3. Add user-friendly loading indicators
4. Update documentation with user guides
5. Deploy to production environment 