import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { handleGoogleCalendarCallback } from '@/lib/composio/config';
import { saveOAuthToken } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';
import { waitForCalendarConnection } from '@/lib/composio/calendar';

/**
 * GET handler for Google Calendar OAuth callback
 * This endpoint handles the OAuth redirect from Google
 */
export async function GET(request: NextRequest) {
  // Get the code and state from the query parameters
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');

  // Validate required parameters
  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL(`/error?message=Invalid OAuth callback parameters`, request.url),
    );
  }

  try {
    // Parse the state parameter
    const state = JSON.parse(stateParam);
    const { callbackUrl, userId } = state;

    // Verify the current user matches the one who initiated the flow
    const session = await auth();
    if (!session?.user || session.user.id !== userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Exchange code for tokens - this is now primarily for backwards compatibility
    // and can be used as a fallback if Composio implementation fails
    const redirectUri =
      process.env.GOOGLE_OAUTH_REDIRECT_URI ||
      new URL('/api/auth/google-calendar/callback', request.url).toString();

    const tokenResponse = await handleGoogleCalendarCallback(code, redirectUri);

    // Wait for the Composio connection to become active
    const connectionResponse = await waitForCalendarConnection(session.user.id);

    // Store connection information in the database
    await saveOAuthToken({
      userId: session.user.id,
      provider: 'google_calendar',
      accessToken: tokenResponse.success
        ? tokenResponse.accessToken
        : undefined,
      refreshToken: tokenResponse.success
        ? tokenResponse.refreshToken
        : undefined,
      expiresAt:
        tokenResponse.success && tokenResponse.expiresAt
          ? new Date(tokenResponse.expiresAt)
          : null,
      composioConnectionId: connectionResponse.success
        ? connectionResponse.connectionId
        : undefined,
    });

    // Check if we have a valid connection
    if (!connectionResponse.success) {
      throw new Error(
        connectionResponse.error ||
          'Failed to establish Google Calendar connection',
      );
    }

    // Redirect back to the callback URL or dashboard
    return NextResponse.redirect(
      new URL(callbackUrl || '/dashboard', request.url),
    );
  } catch (error) {
    console.error('Error handling Google Calendar OAuth callback:', error);

    // Redirect to error page
    return NextResponse.redirect(
      new URL(
        `/error?message=Failed to complete Google Calendar authentication`,
        request.url,
      ),
    );
  }
}
