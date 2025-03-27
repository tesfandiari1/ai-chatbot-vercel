import { NextRequest, NextResponse } from 'next/server';
import { getOAuthToken } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

/**
 * GET handler to check if a user has authenticated with Google Calendar
 * and has a valid Composio connection
 */
export async function GET(request: NextRequest) {
  // Get the authenticated session
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  try {
    // Get userId from query params or use the authenticated user
    const searchParams = request.nextUrl.searchParams;
    const requestedUserId = searchParams.get('userId');
    const callbackUrl =
      searchParams.get('callbackUrl') || request.headers.get('referer') || '/';

    // Only allow querying your own auth status
    if (requestedUserId && requestedUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to check this user's auth status" },
        { status: 403 },
      );
    }

    // Check if the user has a Google Calendar OAuth token and Composio connection
    const token = await getOAuthToken(session.user.id, 'google_calendar');
    const hasComposioConnection = !!token?.composioConnectionId;

    // If not authenticated with Google Calendar, return auth URL
    if (!token) {
      return NextResponse.json({
        isAuthenticated: false,
        authUrl: `/api/auth/google-calendar?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      });
    }

    // If token exists but no Composio connection, return auth URL
    if (!hasComposioConnection) {
      return NextResponse.json({
        isAuthenticated: false,
        hasLegacyToken: true,
        authUrl: `/api/auth/google-calendar?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      });
    }

    // Return authentication status
    return NextResponse.json({
      isAuthenticated: true,
      hasComposioConnection,
      expiresAt: token?.expiresAt || null,
    });
  } catch (error) {
    console.error('Error checking Google Calendar authentication:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 },
    );
  }
}
