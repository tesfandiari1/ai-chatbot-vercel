import type { StorybookConfig } from '@storybook/experimental-nextjs-vite';
import * as path from 'node:path';

const config: StorybookConfig = {
  stories: [
    '../components/**/*.mdx',
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../app/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/experimental-nextjs-vite',
    options: {
      nextConfigPath: path.resolve(__dirname, '../next.config.ts'),
      // Use type assertion to bypass the type check
      ...({
        image: {
          loading: 'eager',
        },
      } as any),
    },
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    // Add path aliases
    if (config.resolve?.alias) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '..'),
      };
    }

    // Disable HMR overlay
    if (config.server) {
      config.server.hmr = {
        overlay: false,
      };
    }

    return config;
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;
