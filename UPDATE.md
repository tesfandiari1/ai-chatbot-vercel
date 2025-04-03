# Project Update Tracker

## Critical Updates
| Tool | Current Version | Target Version | Status | Notes |
|------|----------------|---------------|--------|-------|
| ESLint | 8.57.1 | 9.23.0 | ✅ Completed | Using traditional config format for Next.js compatibility |
| pnpm | 9.12.3 | 10.7.1 | ✅ Completed | .npmrc file configured |
| tailwindcss | 4.1.1 | 3.4.17 | ✅ Completed | Downgraded to resolve build failures |
| React | 18.x | 19.0.0-rc | ✅ Keeping | Addressed compatibility with pnpm overrides |
| Next.js | 14.x | 15.3.0-canary | ✅ Keeping | Will address any stability issues individually |

## Secondary Updates
| Tool | Current Version | Target Version | Status | Notes |
|------|----------------|---------------|--------|-------|
| eslint-config-next | 14.2.5 | 15.2.4 | ✅ Completed | Updated alongside ESLint |
| eslint-config-prettier | 9.1.0 | 10.1.1 | ✅ Completed | Updated alongside ESLint |
| eslint-import-resolver-typescript | 3.8.7 | 4.3.1 | ✅ Completed | Updated alongside ESLint |
| @tailwindcss/postcss | 4.1.1 | N/A | ✅ Removed | Not used with Tailwind CSS 3.x |

## Build Issues Analysis

### Tailwind CSS 4.0 Migration Issues
The upgrade to Tailwind CSS 4.0 caused significant build failures that we now plan to resolve by downgrading:

1. **Incompatible Component Syntax**:
   - Tailwind 4.0 requires arbitrary value syntax for all color utilities
   - Many components still use standard utility classes like `bg-background` instead of `bg-[hsl(var(--background))]`
   - Converting all components would require substantial effort

2. **PostCSS Configuration Issues**:
   - Current build process is incompatible with Tailwind 4.0's architecture
   - Switching between `tailwindcss` and `@tailwindcss/postcss` requires script changes

3. **Development Complexity**:
   - Arbitrary value syntax is more verbose and error-prone for developers
   - Current team workflows are optimized for Tailwind 3.x patterns

### React 19 RC and Next.js Canary Compatibility
- We will maintain React 19 RC and Next.js 15 Canary while addressing specific compatibility issues

## Action Plan

### 1. Downgrade Tailwind CSS to 3.4.17

- [x] Uninstall tailwindcss v4.1.1 and @tailwindcss/postcss
- [x] Install tailwindcss v3.4.17 and required dependencies
- [x] Restore original postcss.config.mjs
- [x] Restore color theme configuration in tailwind.config.ts

### 2. Revert Component Changes

- [x] Restore any components modified to use arbitrary value syntax:
  - Revert `bg-[hsl(var(--background))]` → `bg-background`
  - Revert `text-[hsl(var(--foreground))]` → `text-foreground`
  - Revert `border-[hsl(var(--border))]` → `border-border`
  - Revert `bg-[hsl(var(--primary)_/_0.2)]` → `bg-primary/20`

- [x] Priority components to revert:
  - components/ui/button.tsx
  - components/ui/dropdown-menu.tsx
  - components/ui/calendar.tsx
  - components/document-skeleton.tsx
  - components/toolbar.tsx
  - components/ui/sidebar.tsx
  - components/ui/sheet.tsx
  - components/ui/alert-dialog.tsx

### 3. Fix CSS and Build Process

- [x] Update package.json build/dev scripts to use standard Tailwind 3.x commands:
  ```
  "dev:css": "npx tailwindcss -i ./css/tailwind.css -o ./public/styles/tailwind.css --watch"
  "build:css": "NODE_ENV=production npx tailwindcss -i ./css/tailwind.css -o ./public/styles/tailwind.css --minify"
  ```

- [x] Restore any changes to CSS files that were specifically made for Tailwind 4.0

### 4. Address React 19 RC Compatibility

- [x] Add compatibility overrides in package.json for libraries with React version constraints
- [ ] Test thoroughly with key UI components

### 5. Clean and Rebuild

- [x] Run clean script to clear cache and build artifacts
- [ ] Rebuild project with downgraded Tailwind CSS: `pnpm run build`
- [ ] Test all components for proper rendering

## Recent Changes to Revert

1. **PostCSS Configuration**:
   - [x] Revert postcss.config.mjs to use 'tailwindcss' instead of '@tailwindcss/postcss'

2. **Tailwind Configuration**:
   - [x] Restore color theme configuration in tailwind.config.ts that was removed for v4.0

3. **Component Modifications**:
   - [x] Revert components that were updated to use arbitrary value syntax
   - [x] Prioritize high-priority UI components (button, dropdown, calendar, etc.)

4. **Build Scripts**:
   - [x] Update package.json to revert to standard Tailwind CLI commands

5. **Package Dependencies**:
   - [x] Remove @tailwindcss/postcss
   - [ ] Re-add eslint-plugin-tailwindcss if compatible with Tailwind 3.4.17

## Progress Overview

### Completed
- [x] Update pnpm to v10.7.1
- [x] Configure .npmrc file with recommended settings
- [x] Install ESLint v9.23.0 and related configs
- [x] Update AI/SDK packages
- [x] Update database packages
- [x] Update UI packages (framer-motion, react-markdown, sonner)
- [x] Update type definitions
- [x] Downgrade Tailwind CSS from 4.1.1 to 3.4.17
- [x] Restore postcss.config.mjs to use standard tailwindcss plugin
- [x] Restore theme configuration in tailwind.config.ts
- [x] Revert components to use standard Tailwind 3.x utility classes
- [x] Update package.json build/dev scripts
- [x] Add React 19 compatibility overrides

### In Progress
- [ ] Clean and rebuild project
- [ ] Test components and UI

### Blocked
- [ ] Re-add eslint-plugin-tailwindcss (check compatibility with Tailwind 3.4.17)

## Compatibility Strategy

### React 19 RC
- Keep React 19 RC while addressing specific library compatibility issues with pnpm overrides
- Test thoroughly with key UI components, especially those from third-party libraries

### Next.js 15 Canary
- Continue using Next.js 15 canary while monitoring for stability issues
- Create fallbacks for any experimental features if needed

## Other Package Updates
We'll maintain all other package updates as they don't appear to be causing issues:

| Category | Packages | Status |
|----------|----------|--------|
| ESLint | eslint, eslint-config-next, etc. | ✅ Keep updated versions |
| pnpm | pnpm@10.7.1 | ✅ Keep updated version |
| AI/SDK | @ai-sdk packages, openai | ✅ Keep updated versions |
| Database | drizzle-kit, drizzle-orm | ✅ Keep updated versions |
| UI | tailwind-merge, framer-motion, react-markdown, sonner | ✅ Keep updated versions |

## Implementation Steps

### 1. Downgrade Tailwind CSS

```bash
# Stop any running dev processes
pnpm run clean:full

# Remove Tailwind CSS 4.0 packages
pnpm remove tailwindcss @tailwindcss/postcss

# Install Tailwind CSS 3.4.17 and dependencies
pnpm add -D tailwindcss@3.4.17 autoprefixer postcss
```

### 2. Restore Configuration Files

Restore postcss.config.mjs:
```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {
      // Add rounded-md class explicitly
      borderRadius: {
        md: '0.375rem', // 6px
      },
    },
    autoprefixer: {},
  },
};

export default config;
```

Restore color theme in tailwind.config.ts:
```typescript
// Add back the colors section under theme.extend
colors: {
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
  },
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  popover: {
    DEFAULT: 'hsl(var(--popover))',
    foreground: 'hsl(var(--popover-foreground))',
  },
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
  sidebar: {
    DEFAULT: 'hsl(var(--sidebar-background))',
    foreground: 'hsl(var(--sidebar-foreground))',
    primary: 'hsl(var(--sidebar-primary))',
    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    accent: 'hsl(var(--sidebar-accent))',
    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    border: 'hsl(var(--sidebar-border))',
    ring: 'hsl(var(--sidebar-ring))',
  },
},
```

### 3. Update Package.json Scripts

```bash
# Update the CSS build commands if needed
sed -i '' 's/tailwindcss-cli/tailwindcss/g' package.json
```

### 4. Add React 19 Compatibility Overrides

Add to package.json:
```json
"pnpm": {
  "overrides": {
    "react-day-picker>react": "19.0.0-rc-45804af1-20241021",
    "react-day-picker>react-dom": "19.0.0-rc-45804af1-20241021",
    "next-themes>react": "19.0.0-rc-45804af1-20241021",
    "next-themes>react-dom": "19.0.0-rc-45804af1-20241021"
  }
}
```

### 5. Clean and Rebuild

```bash
# Clean build artifacts
pnpm run clean

# Rebuild the project
pnpm run build

# Start development server
pnpm run dev
```

### 6. Testing

After implementation, test:
- Key UI components with color theming
- Dark/light mode toggle functionality
- Calendar component interactions
- Any components with known issues identified in the analysis 