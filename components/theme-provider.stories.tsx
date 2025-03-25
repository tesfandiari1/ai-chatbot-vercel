'use client';

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from './theme-provider';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';

const meta: Meta<typeof ThemeProvider> = {
  title: 'Core/ThemeProvider',
  component: ThemeProvider,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof ThemeProvider>;

// Create a component to demonstrate theme switching
const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <h3 className="text-lg font-medium">Current theme: {theme}</h3>
      <div className="flex gap-2">
        <Button onClick={() => setTheme('light')}>Light</Button>
        <Button onClick={() => setTheme('dark')}>Dark</Button>
        <Button onClick={() => setTheme('system')}>System</Button>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeSwitcher />
    </ThemeProvider>
  ),
};
