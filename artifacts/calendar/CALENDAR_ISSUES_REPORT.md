# Calendar Functionality Issues Report

## Overview

The calendar artifact is a multi-step wizard for scheduling appointments that integrates with Google Calendar. It provides date selection, time selection, meeting details collection, and confirmation functionality. Based on a thorough code review, this report identifies several issues affecting performance, styling, and user experience.

## Current Architecture

The calendar system consists of:

1. **Main Components**:
   - `CalendarContainer`: Wrapper component with loading state
   - `DatePicker`: Date selection interface
   - `TimePicker`: Time slot selection
   - `DetailsForm`: Meeting details collection
   - `Confirmation`: Confirmation screen
   - `CalendarStyleLoader`: Custom styling component

2. **API Endpoints**:
   - `/api/calendar/check-auth`: Check if user is authenticated with Google Calendar
   - `/api/auth/google-calendar`: Start OAuth flow
   - `/api/auth/google-calendar/callback`: Handle OAuth callback

3. **State Management**:
   - Managed via the Artifact pattern
   - Metadata stored in parent component, passed down to children

## Key Issues Identified

### 1. Loading & Refresh Issues

**Issue:** The calendar frequently shows "Loading calendar..." and appears to reload unnecessarily.

**Root Causes:**
- **Multiple Render Triggers**: The `useEffect` hooks in `CalendarArtifact` trigger loading state changes frequently
- **Inefficient Auth Checking**: Every time the session changes, an auth check is triggered
- **No Loading State Debouncing**: Frequent state changes cause UI flickering
- **Simulated API Calls**: Dummy time slots are loaded with a 1-second timeout, causing unnecessary loading states

**Code Evidence:**
```typescript
// In client.tsx
useEffect(() => {
  if (session?.user?.id) {
    setIsAuthChecking(true);
    checkGoogleCalendarAuth(session.user.id)
      .then((isAuthenticated) => {
        updateMetadata({ isAuthenticated });
      })
      .finally(() => {
        setIsAuthChecking(false);
      });
  }
}, [session, updateMetadata]);

// Time slot loading with artificial delay
useEffect(() => {
  if (safeMetadata.selectedDate && safeMetadata.isAuthenticated) {
    setIsLoading(true);
    setTimeout(() => {
      updateMetadata({
        availableTimeSlots: [
          // Dummy data
        ],
      });
      setIsLoading(false);
    }, 1000);
  }
}, [safeMetadata.selectedDate, safeMetadata.isAuthenticated, updateMetadata]);
```

### 2. Styling Inconsistencies

**Issue:** Calendar cells have inconsistent styling, particularly days 17-31 with dark backgrounds.

**Root Causes:**
- **CSS Application Method**: Styles are applied using multiple approaches
  - Directly imported CSS file
  - Dynamically injected styles via `CalendarStyleLoader`
  - Inline Tailwind classes
- **Z-index Issues**: Improper stacking context causing rendering problems
- **Inconsistent Button Variants**: Mix of 'ghost', 'outline', and 'default' variants

**Code Evidence:**
```typescript
// In DatePicker.tsx - Multiple style sources
import '../styles/calendar.css';
import { CalendarStyleLoader } from './CalendarStyleLoader';

// In CalendarStyleLoader.tsx - Dynamic style injection
useEffect(() => {
  const style = document.createElement('style');
  style.textContent = `
    .calendar-wrapper .grid button[data-state="active"] {
      background-color: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
    }
    // More styles...
  `;
  document.head.appendChild(style);
  // ...
}, []);
```

### 3. Inefficient Rendering

**Issue:** Components re-render excessively, causing performance problems.

**Root Causes:**
- **No Memoization**: Functions and components aren't memoized
- **Missing Dependencies**: Some `useEffect` hooks have incomplete dependency arrays
- **State Structure**: Flat state structure causes full re-renders on any change

**Code Evidence:**
```typescript
// In client.tsx - No memoization of handlers
const handleNextStep = () => {
  const currentStep = safeMetadata.step;
  // Logic...
};

// Missing dependency array optimizations
// Functions created in render body passed as props
<DatePicker
  selectedDate={safeMetadata.selectedDate}
  onDateSelect={(date) => updateMetadata({ selectedDate: date })}
/>
```

### 4. Authentication Issues

**Issue:** Google Calendar authentication is mocked, bypassing real authentication.

**Root Causes:**
- **Temporary Mock**: Authentication is currently bypassed with a mock
- **Database Issues**: Comment suggests the database integration isn't working

**Code Evidence:**
```typescript
// In client.tsx
const checkGoogleCalendarAuth = async (userId: string): Promise<boolean> => {
  try {
    // TEMPORARY MOCK: Return true to bypass authentication issues
    console.log('Using mock Google Calendar authentication');
    return true;

    /* ORIGINAL CODE - Uncomment when database is fixed
    const response = await fetch(`/api/calendar/check-auth?userId=${userId}`);
    const data = await response.json();
    return data.isAuthenticated;
    */
  } catch (error) {
    console.error('Error checking Google Calendar auth:', error);
    return false;
  }
};
```

### 5. CSS Side Effects

**Issue:** CSS conflicts and side effects cause styling issues.

**Root Causes:**
- **Global CSS Injection**: Direct DOM manipulation to add styles 
- **Namespace Conflicts**: Insufficiently scoped CSS selectors
- **No CSS Modules**: Traditional CSS instead of CSS modules

**Code Evidence:**
```typescript
// In CalendarStyleLoader.tsx - Global CSS injection
return (
  <Script
    id="calendar-fix"
    strategy="afterInteractive"
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          // Fix for dark mode and stacked elements
          const style = document.createElement('style');
          style.textContent = \`
            .calendar-wrapper .grid button {
              position: relative;
              z-index: 1;
            }
          \`;
          document.head.appendChild(style);
        })();
      `,
    }}
  />
);
```

## Recommendations

### 1. State Management Optimization

- **Replace Multiple Loading States**: Consolidate loading states into one state with typed reasons
- **Memoize Handlers**: Use `useCallback` for event handlers
- **Optimize Component Hierarchy**: Split UI to minimize re-renders

```typescript
// Recommended approach for loading state
type LoadingReason = 'auth' | 'timeSlots' | 'none';
const [loadingReason, setLoadingReason] = useState<LoadingReason>('none');
const isLoading = loadingReason !== 'none';
```

### 2. CSS Structure Improvements

- **Use CSS Modules**: Replace direct CSS imports with CSS modules
- **Remove Dynamic Style Injection**: Remove script and useEffect style injection
- **Consolidate Theme Support**: Use a consistent approach for theme support
- **Namespace CSS Classes**: Ensure proper scoping of class names

### 3. Performance Optimizations

- **Memoize Components**: Wrap appropriate components with `React.memo`
- **Debounce State Updates**: Prevent rapid state changes
- **Optimize Re-renders**: Use targeted state updates
- **Virtualize Large Lists**: If calendar grows to support many time slots

### 4. Authentication Fix

- **Re-enable Real Authentication**: Replace mock with actual authentication
- **Add Loading States**: Show proper loading during auth check
- **Handle Auth Errors**: Improve error handling for auth failures

### 5. API Integration

- **Remove Simulated Delays**: Replace setTimeout with real data
- **Add Proper Error Handling**: Handle API failures gracefully
- **Consider SWR or React Query**: Use modern data fetching libraries

## Implementation Priority

1. **Fix Loading/Refresh Issues**: Highest priority - degrades user experience
2. **Resolve CSS/Styling Problems**: High priority - affects visual consistency
3. **Optimize Performance**: Medium priority - will improve responsiveness
4. **Fix Authentication**: Lower priority - can keep using mock for now
5. **Refactor API Integration**: Lowest priority - dependent on other fixes

## Next Steps

1. Implement these recommendations using an incremental approach
2. Test changes thoroughly, especially in dark mode and across different browsers
3. Consider writing automated tests to ensure stability
4. Document the component API for better developer experience 