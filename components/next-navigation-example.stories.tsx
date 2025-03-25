'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';

// Simple component that demonstrates Next.js navigation hooks
const NavigationExample = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleNavigation = () => {
    router.push('/example?param=value');
  };

  const handleBack = () => {
    router.back();
  };

  // Safely handle searchParams which might be null
  const paramsString = searchParams
    ? JSON.stringify(Object.fromEntries(searchParams.entries()))
    : '{}';

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Next.js Navigation Example</CardTitle>
        <CardDescription>
          Demonstrates using navigation hooks in Storybook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded bg-muted/50">
          <p className="text-sm font-medium">Current pathname:</p>
          <p className="text-sm font-mono">{pathname}</p>
        </div>

        <div className="p-4 border rounded bg-muted/50">
          <p className="text-sm font-medium">Current search params:</p>
          <p className="text-sm font-mono">{paramsString}</p>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={handleNavigation}>Navigate</Button>
        <Button variant="outline" onClick={handleBack}>
          Go Back
        </Button>
      </CardFooter>
    </Card>
  );
};

const meta: Meta<typeof NavigationExample> = {
  title: 'Next.js/Navigation',
  component: NavigationExample,
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/dashboard',
        query: { id: 'example-id' },
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof NavigationExample>;

// Basic example
export const Basic: Story = {};

// Example with different pathname
export const DifferentPathname: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/settings',
        query: {},
      },
    },
  },
};

// Example with search params
export const WithSearchParams: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/products',
        query: { category: 'electronics', sort: 'price-asc' },
      },
    },
  },
};
