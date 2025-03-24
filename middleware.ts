import NextAuth from 'next-auth';
import { authConfig } from '@/app/(auth)/auth.config';

// Apply NextAuth middleware
export default NextAuth(authConfig).auth;

// Configure middleware to only run on specific paths for better performance
export const config = {
  // Only run middleware on routes that require authentication
  matcher: [
    // App routes that need authentication
    '/',
    '/:id(.*)',
    '/api/:path*',

    // Auth routes (but exclude API callback routes)
    '/login',
    '/register',

    // Skip middleware on public static files for better performance
    '/((?!_next/static|_next/image|favicon.ico|api/auth/).*)',
  ],
};
