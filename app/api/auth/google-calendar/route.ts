import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getGoogleCalendarAuthUrl } from '@/lib/composio/config';
import { auth } from '@/app/(auth)/auth';

/**
 * GET handler to start Google Calendar OAuth flow
 * This endpoint redirects the user to Google's OAuth consent screen
 */
export async function GET(request: NextRequest) {
  // Get the authenticated user session
  const session = await auth();

  // Check if user is logged in
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Get callback URL from request or use default
  const callbackUrl =
    request.nextUrl.searchParams.get('callbackUrl') ||
    new URL('/dashboard', request.url).toString();

  try {
    // Create state parameter with user info and callback URL
    const state = JSON.stringify({
      callbackUrl,
      userId: session.user.id,
    });

    // Get the OAuth URL
    const authUrl = await getGoogleCalendarAuthUrl(
      process.env.GOOGLE_OAUTH_REDIRECT_URI ||
        new URL('/api/auth/google-calendar/callback', request.url).toString(),
      state,
    );

    // Redirect to Google's consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Failed to create Google Calendar auth URL:', error);

    // Redirect to error page with message
    return NextResponse.redirect(
      new URL(
        `/error?message=Failed to start Google Calendar authentication`,
        request.url,
      ),
    );
  }
}
