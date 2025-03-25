'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

type TooltipDemoProps = {
  content?: string;
  children?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  delayDuration?: number;
};

// We need to create a wrapper component to make Storybook handle this properly
const TooltipDemo = ({
  content = 'Tooltip content',
  children = <Button>Hover me</Button>,
  side = 'top',
  sideOffset = 4,
  delayDuration = 0,
}: TooltipDemoProps) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} sideOffset={sideOffset}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const meta: Meta<typeof TooltipDemo> = {
  title: 'UI/Tooltip',
  component: TooltipDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'The content of the tooltip',
    },
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'The preferred side of the trigger to render against',
    },
    sideOffset: {
      control: 'number',
      description: 'The distance from the trigger',
    },
    delayDuration: {
      control: 'number',
      description: 'How long to wait before showing the tooltip (in ms)',
    },
  },
};

export default meta;

type Story = StoryObj<typeof TooltipDemo>;

export const Basic: Story = {
  args: {
    content: 'This is a tooltip',
  },
};

export const WithDelay: Story = {
  args: {
    content: 'This tooltip has a delay',
    delayDuration: 500,
  },
};

export const BottomPlacement: Story = {
  args: {
    content: 'Tooltip on the bottom',
    side: 'bottom',
  },
};

export const WithLongContent: Story = {
  args: {
    content:
      'This tooltip has a bit more content to show how it handles longer text with wrapping.',
    side: 'right',
  },
};

export const OnIconButton: Story = {
  args: {
    content: 'Add to favorites',
    children: (
      <Button variant="ghost" size="icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        <span className="sr-only">Add to favorites</span>
      </Button>
    ),
  },
};
