# Calendar Components

This directory contains components for the calendar scheduling feature. The components render within the chat UI to provide a seamless booking experience.

## Architecture

The calendar feature now follows this simplified, structured architecture:

1. **UI Layer**: React components using shared UI primitives from ui-components.tsx
2. **State Management**: React Context as the single source of truth via context.tsx
3. **Utilities**: Centralized utilities in lib/calendar/utils.ts
4. **Configuration**: Feature flags and settings in lib/calendar/config.ts
5. **Integration Layer**: MCP server integration in server/route.ts

## Components

### Main Components

* **AppointmentFlow**: The primary coordinator component that renders the entire booking flow
* **DatePicker**: Calendar for selecting appointment dates
* **TimePicker**: Time slots selection for appointment booking
* **AppointmentForm**: Form for entering booking details
* **Confirmation**: Displays appointment confirmation details
* **EventSearchResults**: Displays search results for appointments

### Utility Components

* **ui-components.tsx**: Shared UI components and utilities
* **ToolResult.tsx**: Components for rendering calendar tool results

## AI Tool Flow

The calendar booking flow works through AI tools:

1. `getCalendarAvailability`: Triggers date selection
2. `getAvailableTimeSlots`: Displays available time slots for a date
3. `prepareAppointmentForm`: Shows the booking form
4. `bookCalendarAppointment`: Creates the calendar event
5. `searchCalendarEvents`: Searches for existing appointments
6. `cancelCalendarEvent`: Cancels an existing appointment

## Integration with AI Tools

The calendar components are designed to work with both the Vercel AI SDK and ModelContextProtocol:

1. Calendar tools are defined in `/lib/ai/tools/calendar-tools.ts`
2. Utilities for tool interaction are provided in `/lib/calendar/utils.ts`
3. MCP integration is handled through registering tools with the MCP server

## Usage

To use the calendar components in conversation context:

```tsx
import { CalendarToolResult } from '@/components/calendar/ToolResult';

// For rendering tool results
<CalendarToolResult 
  toolName="getCalendarAvailability" 
  data={resultData} 
  isLoading={false} 
/>

// For rendering a tool call (before result is available)
<CalendarToolResult 
  toolName="getCalendarAvailability" 
  data={args} 
  isLoading={true}
  isToolCall={true} 
/>
```

## Styling Guidelines

All components:
1. Use shadcn/ui components for consistency
2. Follow the app's design system with the updated shared UI components
3. Are responsive and mobile-friendly
4. Include accessibility features (ARIA attributes, keyboard navigation)
5. Use the `cn()` utility for conditional class names

## Best Practices

1. Use the shared UI components from ui-components.tsx for consistency
2. Leverage the CalendarProvider for state management
3. Use the createCalendarComponentProps utility for calendar interaction
4. Follow the pattern of configuration-based rendering in AppointmentFlow

For more details, see the full refactoring documentation in `/docs/calendar-refactoring.md`.