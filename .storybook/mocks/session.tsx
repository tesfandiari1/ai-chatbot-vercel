import React from 'react';
import { SessionProvider } from 'next-auth/react';

export function MockSessionProvider({
  children,
  mockSession = defaultMockSession,
}: {
  children: React.ReactNode;
  mockSession?: any;
}) {
  return <SessionProvider session={mockSession}>{children}</SessionProvider>;
}

// Default user session for stories
export const defaultMockSession = {
  user: {
    id: 'user-1',
    name: 'Storybook User',
    email: 'user@example.com',
    image: 'https://avatar.vercel.sh/user',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};
