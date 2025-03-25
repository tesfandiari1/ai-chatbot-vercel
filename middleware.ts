import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // App routes that need authentication
    '/',
    '/:id',

    // API routes that need authentication (except auth routes)
    '/api/((?!auth).*)/:path*',

    // Allow direct access to login/register
    '/login',
    '/register',
  ],
};
