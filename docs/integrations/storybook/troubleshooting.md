# Storybook Troubleshooting Guide

This document provides solutions for common Storybook issues in our project.

## MDX File Indexing Issues

If you encounter errors like `No matching indexer found for [filepath]`, try these solutions:

1. **Use `.mdx` instead of `.stories.mdx`** 
   - Rename your files from `component.stories.mdx` to `component.mdx`
   - This helps Storybook properly index MDX documentation files

2. **Clear Storybook Cache**
   - Use `pnpm storybook:clean` to clear the cache and start Storybook
   - Alternatively, manually delete:
     ```
     rm -rf ./node_modules/.cache/storybook
     rm -rf ./.storybook/cache
     ```

3. **Use the Fixed Storybook Starter**
   - Run `pnpm storybook:fixed` which uses our custom starter script
   - This script handles cache clearing and proper MDX configuration

## Port Conflicts

If Storybook fails to start because the port is already in use:

1. **Check Port Availability**
   - Run `pnpm check:ports` to see which ports are already in use
   - Find processes using ports: `lsof -i :6006` (replace 6006 with port number)

2. **Use Alternative Port**
   - Start Storybook on a different port:
     ```
     pnpm storybook -- -p 6007
     ```
   - Or with our fixed script: `node storybook-start.js --port 6008`

## Missing Addons

If you see warnings about missing addons:

1. **Install Required Addons**
   ```
   pnpm add -D @storybook/addon-links @storybook/addon-interactions @storybook/addon-essentials
   ```

2. **Check .storybook/main.ts Configuration**
   - Ensure all addons are properly listed in the `addons` array

## Component Rendering Issues

If components fail to render in Storybook:

1. **Check for Missing Context Providers**
   - Make sure all required providers (ThemeProvider, etc.) are added in `.storybook/preview.tsx`

2. **Add Component-specific Decorators**
   - Use decorators in your stories to provide required context
   ```jsx
   export default {
     component: MyComponent,
     decorators: [(Story) => <RequiredProvider><Story /></RequiredProvider>]
   };
   ```

3. **Mock External Dependencies**
   - Create mocks for API calls or other external dependencies in `.storybook/mocks/`

## Deployment Script Issues

When using the deployment script with Storybook:

1. **Skip Storybook if Needed**
   ```
   pnpm deploy:local:dev -- --skip-storybook
   ```

2. **Run Storybook Separately**
   - Run the main application with `pnpm deploy:local:dev -- --skip-storybook`
   - Then run Storybook separately: `pnpm storybook:fixed`

## Useful Commands

```bash
# Standard Storybook
pnpm storybook

# Storybook with cleared cache
pnpm storybook:clean

# Fixed Storybook starter (recommended)
pnpm storybook:fixed

# Fixed starter with custom port
node storybook-start.js --port 6008

# Check port availability
pnpm check:ports

# Run deployment without Storybook
pnpm deploy:local:dev -- --skip-storybook
``` 