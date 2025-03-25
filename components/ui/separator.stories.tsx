'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './separator';

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the separator',
    },
    decorative: {
      control: 'boolean',
      description:
        'Whether the separator is decorative or semantically meaningful',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    className: 'w-64',
  },
  render: (args) => (
    <div className="space-y-4 w-64">
      <div className="text-sm text-muted-foreground">Horizontal Separator</div>
      <Separator {...args} />
      <div className="text-sm">Content below the separator</div>
    </div>
  ),
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    className: 'h-64',
  },
  render: (args) => (
    <div className="flex h-64 items-center space-x-4">
      <div className="text-sm text-muted-foreground">Left</div>
      <Separator {...args} />
      <div className="text-sm">Right</div>
    </div>
  ),
};

export const WithContent: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div className="text-lg font-semibold">Settings</div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Profile</div>
        <Separator orientation="vertical" />
        <div>Account</div>
        <Separator orientation="vertical" />
        <div>Notifications</div>
      </div>
    </div>
  ),
};
