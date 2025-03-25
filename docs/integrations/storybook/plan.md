# Storybook Implementation Plan

This document outlines the plan for fully implementing Storybook to document our shadcn/ui components and application features.

## Current Progress

- [x] Basic Storybook setup with Next.js integration
- [x] Theme toggle support
- [x] Documentation page for shadcn/ui introduction
- [x] Stories for basic components (Button, Input, Textarea, Card, Select)
- [x] Next.js-specific configuration (Image support, App Router)
- [x] Next.js mocks for navigation, headers, and cache
- [x] Fixed font support to match application fonts (Geist)
- [x] Enhanced font implementation with direct CSS injection

## Next Steps

### 1. UI Component Documentation (Priority: High)

Complete stories for all shadcn/ui components:

- [x] Button
- [x] Input
- [x] Textarea
- [x] Card
- [x] Select
- [x] Label
- [x] Alert Dialog
- [ ] Dropdown Menu
- [x] Separator
- [ ] Sheet
- [x] Tooltip
- [ ] Skeleton

Focus on documenting:
- All variants and states
- Accessibility considerations
- Common usage patterns
- Props and customization options

### 2. Application-Specific Components (Priority: Medium)

Create stories for application-specific components:

- [ ] Chat interface
- [ ] Message display
- [ ] Code blocks
- [ ] Markdown rendering
- [ ] Suggested actions
- [ ] Sidebar navigation

For these components, we'll need to:
- Create mock data/state
- Handle client-side only functionality
- Document integration with AI features

### 3. Next.js-Specific Features (Priority: High)

Test and document components that use Next.js-specific features:

- [x] Components using `next/image` (Example created)
- [x] Components using App Router features (Navigation example created)
- [ ] Components using server components (via client wrappers)
- [ ] Components using `next/headers` and cookies

### 4. Advanced Features (Priority: Low)

Document more complex interactions:

- [ ] AI model selector
- [ ] Theme switcher
- [ ] Authentication flow
- [ ] Chat history
- [ ] File uploads

### 5. Storybook Enhancements (Priority: Medium)

Improve the Storybook experience:

- [ ] Custom theme for Storybook UI
- [ ] Add more detailed documentation pages
- [ ] Set up component categories and organization
- [ ] Add interaction tests with play functions
- [ ] Add accessibility tests

### 6. CI/CD Integration (Priority: Low)

- [ ] Add Storybook build to CI pipeline
- [ ] Set up Chromatic for visual regression testing
- [ ] Configure automatic deployment of Storybook

## Font Configuration

To ensure Storybook matches the font styling of our application, we've added explicit font configuration:

1. **Import Geist Fonts**:
   ```tsx
   import { Geist, Geist_Mono } from 'next/font/google';
   
   // Load fonts
   const geist = Geist({
     subsets: ['latin'],
     display: 'swap',
     variable: '--font-geist',
   });
   
   const geistMono = Geist_Mono({
     subsets: ['latin'],
     display: 'swap',
     variable: '--font-geist-mono',
   });
   ```

2. **Apply Font CSS**:
   ```tsx
   // Add font CSS to the preview head
   const fontStyles = `
     body {
       font-family: var(--font-geist), sans-serif !important;
     }
     
     pre, code {
       font-family: var(--font-geist-mono), monospace !important;
     }
   `;
   
   // In decorator
   <div className={`${geist.variable} ${geistMono.variable}`}>
     <style>{fontStyles}</style>
     {/* Rest of the decorator */}
   </div>
   ```

This approach ensures the fonts are loaded and consistently applied throughout Storybook.

## Interactive Components

For interactive components like AlertDialog and Dropdown, we need to create wrapper components that manage state:

```tsx
const AlertDialogDemo = (props) => {
  const [open, setOpen] = useState(false);
  
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {/* Component implementation */}
    </AlertDialog>
  );
};
```

This pattern allows us to:
1. Control the internal state of the component
2. Make props available for modification in Storybook controls
3. Show the component in a realistic state
4. Avoid issues with prop controls causing unwanted state resets

We've successfully applied this technique to components like:
- **Tooltip** - Manages hover state and content positioning
- **AlertDialog** - Manages open/close state with customizable content

## Complex Component Handling

For components with multiple subcomponents (like Card, AlertDialog), we follow these patterns:

1. **Create a comprehensive wrapper** that imports and uses all subcomponents
2. **Document all subcomponents** in the story description
3. **Provide examples of common combinations** rather than showing each subcomponent in isolation
4. **Use descriptive story names** that explain the use case rather than the component structure

## Type Safety

To ensure proper type safety in stories:

1. **Define proper types** for all component props, especially for complex props or enums:
   ```tsx
   type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
   ```

2. **Use type assertions carefully** when dealing with constrained types:
   ```tsx
   triggerVariant = 'destructive' as ButtonVariant,
   ```

3. **Add proper argTypes** to generate correct controls in Storybook:
   ```tsx
   argTypes: {
     variant: {
       control: 'select',
       options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
     },
   }
   ```

## Next.js-Specific Configuration

Our Storybook is configured specifically for Next.js with:

```typescript
// In .storybook/main.ts
framework: {
  name: '@storybook/experimental-nextjs-vite',
  options: {
    nextConfigPath: path.resolve(__dirname, '../next.config.ts'),
    image: {
      loading: 'eager',
    },
  },
}

// In .storybook/preview.tsx
parameters: {
  nextjs: {
    appDirectory: true, // Enable App Router features
  },
  // Other parameters...
}
```

### Using Next.js Features in Stories

When creating stories for components that use Next.js features, follow these patterns:

#### For components using `next/image`:

```tsx
import Image from 'next/image';

export const WithImage: Story = {
  render: () => (
    <div>
      <Image src="/example.jpg" alt="Example" width={500} height={300} />
    </div>
  ),
};
```

#### For components using App Router navigation:

```tsx
export const WithNavigation: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/chat',
        query: { id: 'example-id' },
      },
    },
  },
};
```

#### For components using Next.js cookies/headers:

```tsx
// In your story setup code:
import { cookies, headers } from '@storybook/nextjs/headers.mock';

// Before your story renders:
cookies().set('auth', 'example-token');
headers().set('x-custom-header', 'example-value');
```

## Development Approach

For each component, follow this process:

1. **Simple Variants**: Document basic usage with different props
2. **Complex Scenarios**: Show common use cases and patterns
3. **Edge Cases**: Demonstrate error states, loading states, etc.
4. **Composition**: Show how components work together

## File Structure Convention

Follow this naming convention for story files:

```
components/ui/[component-name].stories.tsx
components/[feature]/[component-name].stories.tsx
```

Use this template for component stories:

```tsx
'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './component-name';

const meta: Meta<typeof ComponentName> = {
  title: 'Category/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // Default props
  },
};

// Additional variants...
```

## Accessibility Focus

For each component story:

- Ensure proper labeling
- Test with keyboard navigation
- Document ARIA attributes
- Check color contrast
- Test with screen readers

## Mocking Strategy

For components that require data or context:

- Create mock data files in `.storybook/mocks/`
- Use context providers in story decorators
- Mock API calls and state management
- Document any special setup required for testing

## Timeline

1. **Phase 1 (1 week)**: Complete all UI component stories
2. **Phase 2 (1 week)**: Implement application-specific component stories
3. **Phase 3 (1 week)**: Add advanced feature documentation
4. **Phase 4 (ongoing)**: Maintain and update as components evolve

## Resources

- [Storybook for Next.js Documentation](https://storybook.js.org/docs/get-started/frameworks/nextjs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) 