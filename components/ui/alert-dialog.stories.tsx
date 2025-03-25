'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from './button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';

// Define the type for the button variant
type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

// We need to create a wrapper component for interactive elements in Storybook
const AlertDialogDemo = ({
  title = 'Are you absolutely sure?',
  description = 'This action cannot be undone. This will permanently delete your account and remove your data from our servers.',
  cancelText = 'Cancel',
  confirmText = 'Continue',
  triggerText = 'Delete Account',
  triggerVariant = 'destructive' as ButtonVariant,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={triggerVariant}>{triggerText}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction>{confirmText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const meta: Meta<typeof AlertDialogDemo> = {
  title: 'UI/AlertDialog',
  component: AlertDialogDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'The title of the alert dialog',
    },
    description: {
      control: 'text',
      description: 'The description of the alert dialog',
    },
    cancelText: {
      control: 'text',
      description: 'The text for the cancel button',
    },
    confirmText: {
      control: 'text',
      description: 'The text for the confirm button',
    },
    triggerText: {
      control: 'text',
      description: 'The text for the trigger button',
    },
    triggerVariant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
      description: 'The variant of the trigger button',
    },
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialogDemo>;

export const Default: Story = {
  args: {
    title: 'Are you absolutely sure?',
    description:
      'This action cannot be undone. This will permanently delete your account and remove your data from our servers.',
    triggerText: 'Delete Account',
    triggerVariant: 'destructive',
  },
};

export const ConfirmPayment: Story = {
  args: {
    title: 'Confirm Payment',
    description:
      'You are about to make a payment of $49.99. This amount will be charged to your default payment method.',
    triggerText: 'Make Payment',
    triggerVariant: 'default',
    confirmText: 'Confirm Payment',
  },
};

export const LeaveWithoutSaving: Story = {
  args: {
    title: 'Leave without saving?',
    description:
      'You have unsaved changes that will be lost if you leave this page.',
    triggerText: 'Leave Page',
    triggerVariant: 'outline',
    confirmText: 'Leave Page',
    cancelText: 'Stay & Save',
  },
};
