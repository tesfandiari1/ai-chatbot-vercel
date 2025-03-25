# Known Issues and Bugs

This document tracks known issues and bugs in the UniWise Chat App.

## Current Issues

1. **None currently tracked** - Please add issues as they are discovered

## Previous Issues (Fixed)

1. **ESLint (pnpm lint)**
   - No ESLint warnings or errors
   - One file automatically fixed
   - Note: TypeScript version warning (using 5.8.2, supported versions >=4.7.4 <5.5.0)

2. **Type Checking (tsc --noEmit)**
   - No type errors found
   - Clean compilation

3. **Build Check (pnpm build)**
   - Successfully compiled
   - All linting and type validations passed
   - Generated 16 static pages
   - Optimized routes and middleware
   - Bundle sizes optimized (First Load JS shared: 108 kB)

**Fixes Applied:**
- Removed invalid `bodyParser` export from file upload route
- Implemented file size limits through Zod schema validation
- Cleaned build cache to resolve chunk loading issues

## Reporting New Issues

When reporting a new issue, please include:

1. **Description** - Clear description of the issue
2. **Steps to Reproduce** - Detailed steps to reproduce the problem
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - OS, browser, version numbers
6. **Screenshots** - If applicable
7. **Possible Solution** - If you have suggestions

## Issue Template

```markdown
### Description
[Clear description of the issue]

### Steps to Reproduce
1. [First Step]
2. [Second Step]
3. [and so on...]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- OS: [e.g. macOS 12.4, Windows 11]
- Browser: [e.g. Chrome 100, Safari 15.4]
- Node.js version: [e.g. 18.12.1]
- pnpm version: [e.g. 7.14.0]

### Screenshots
[If applicable]

### Possible Solution
[If you have suggestions]
```

## Issue Tracking Process

1. Issues are first reported and documented in this file
2. Critical issues are prioritized for immediate resolution
3. Issues are assigned to team members for investigation
4. Resolved issues are moved to the "Fixed" section with solution details 