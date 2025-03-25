'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';
import { Input } from './input';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof Label>;

export const Basic: Story = {
  args: {
    children: 'Label',
    htmlFor: 'example',
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Enter your email" />
    </div>
  ),
};

export const WithDisabledInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="disabled-email">Email</Label>
      <Input
        type="email"
        id="disabled-email"
        disabled
        placeholder="Enter your email"
      />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label
        htmlFor="required-email"
        className="after:content-['*'] after:ml-0.5 after:text-red-500"
      >
        Email
      </Label>
      <Input
        type="email"
        id="required-email"
        placeholder="Enter your email"
        required
      />
    </div>
  ),
};
