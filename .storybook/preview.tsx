import React from 'react';
import type { Preview, } from '@storybook/react';
import '../app/globals.css';
import { ThemeProvider } from '../components/theme-provider';
import { MockSessionProvider } from './mocks/session';
import { Toaster } from 'sonner';
import { Geist, Geist_Mono } from 'next/font/google';
import { Inter } from 'next/font/google';

// Load fonts
const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

// Add font CSS to the preview head
const fontStyles = `
  body {
    font-family: var(--font-geist), sans-serif !important;
  }
  
  pre, code {
    font-family: var(--font-geist-mono), monospace !important;
  }
`;

// Theme toggle decorator for viewing components in different themes
const withThemeDecorator = (StoryFn, context) => {
  // Get the current theme from parameters or use system
  const theme = context.parameters.theme || context.globals.theme || 'system';

  return (
    <div
      className={`${geist.variable} ${geistMono.variable} ${inter.className}`}
    >
      <style>{fontStyles}</style>
      <MockSessionProvider>
        <ThemeProvider attribute="class" defaultTheme={theme} enableSystem>
          <div className="min-h-screen bg-background text-foreground p-4">
            <Toaster position="top-center" />
            <StoryFn />
          </div>
        </ThemeProvider>
      </MockSessionProvider>
    </div>
  );
};

const preview: Preview = {
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    layout: 'centered',
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: 'hsl(0 0% 96.9%)' }, // Same as bg-background in light mode
        { name: 'dark', value: 'hsl(120 16.7% 2.7%)' }, // Same as bg-background in dark mode
      ],
    },
    docs: {
      toc: true, // Enable table of contents for autodocs
    },
  },
  decorators: [withThemeDecorator],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'system',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
          { value: 'system', icon: 'computer', title: 'System' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
