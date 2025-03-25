// MDX setup for Storybook
import { createCompiler } from '@storybook/addon-docs/mdx-compiler-plugin';
import remarkGfm from 'remark-gfm';

export const createMdxCompiler = () => {
  return createCompiler({
    remarkPlugins: [remarkGfm],
  });
};
