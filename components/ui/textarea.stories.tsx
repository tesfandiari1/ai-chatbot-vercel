'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Type your message here.',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea',
    disabled: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <label htmlFor="message" className="text-sm font-medium">
        Your message
      </label>
      <Textarea
        id="message"
        placeholder="Type your message here."
        className="resize-none"
        rows={4}
      />
      <p className="text-xs text-muted-foreground">
        Your message will be sent to our team.
      </p>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <label htmlFor="message-error" className="text-sm font-medium">
        Your message
      </label>
      <Textarea
        id="message-error"
        placeholder="Type your message here."
        className="resize-none border-destructive"
        rows={4}
      />
      <p className="text-xs text-destructive">Please enter a valid message.</p>
    </div>
  ),
};
