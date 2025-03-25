'use client';

import type { Meta, StoryObj } from '@storybook/react';
import Image from 'next/image';

// Simple component to demonstrate Next.js Image
const NextImageExample = ({
  src = '/placeholder.jpg',
  alt = 'Example image',
  width = 400,
  height = 300,
  priority = false,
}) => (
  <div className="flex flex-col items-center gap-4 p-4 border rounded-md">
    <h3 className="text-xl font-semibold">Next.js Image Component</h3>
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className="rounded-md"
    />
    <p className="text-sm text-muted-foreground">
      This image is optimized by Next.js Image component
    </p>
  </div>
);

const meta: Meta<typeof NextImageExample> = {
  title: 'Next.js/Image',
  component: NextImageExample,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alternative text for the image',
    },
    width: {
      control: 'number',
      description: 'Image width in pixels',
    },
    height: {
      control: 'number',
      description: 'Image height in pixels',
    },
    priority: {
      control: 'boolean',
      description: 'Whether the image should be preloaded',
    },
  },
};

export default meta;

type Story = StoryObj<typeof NextImageExample>;

// Example with local image from public directory
export const LocalImage: Story = {
  args: {
    src: '/placeholder.jpg',
    alt: 'Placeholder image',
    width: 400,
    height: 300,
  },
};

// Example with remote image
export const RemoteImage: Story = {
  args: {
    src: 'https://avatar.vercel.sh/storybook?size=400',
    alt: 'Vercel avatar',
    width: 400,
    height: 400,
  },
};

// Example with priority loading
export const PriorityImage: Story = {
  args: {
    src: '/placeholder.jpg',
    alt: 'Priority loaded image',
    width: 400,
    height: 300,
    priority: true,
  },
};
