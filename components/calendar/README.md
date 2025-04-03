# Calendar Components

This directory contains React components for the chat-based calendar booking system. The components render within the chat UI to provide a seamless booking experience.

## Component Structure

- `DatePicker.tsx`: Calendar component for selecting dates
- `TimePicker.tsx`: Component for displaying and selecting available time slots
- `AppointmentForm.tsx`: Form component for collecting booking details
- `Confirmation.tsx`: Confirmation screen after successful booking
- `index.ts`: Exports all components for easy imports

## Migration Plan from Artifact to Chat UI

We've successfully migrated the calendar components from the artifact-based implementation to a chat-based UI:

1. ✅ **Component Migration**:
   - Migrated all components from `/artifacts/calendar/components/` to `/components/calendar/`
   - Improved components with shadcn/ui styling and accessibility
   - Removed redundant Simple* components

2. ✅ **Import Path Updates**:
   - Updated all import paths in `message.tsx` to use components from this directory
   - Centralized exports in `index.ts`

3. ✅ **Type Centralization**:
   - Moved all types to `/lib/calendar/types.ts`
   - Updated components to use centralized types

## Architecture

The calendar booking flow now works through AI tools and chat-based UI components:

1. **AI Tool Flow**:
   - `getCalendarAvailability`: Triggers date selection
   - `getAvailableTimeSlots`: Displays available time slots for a date
   - `prepareAppointmentForm`: Shows the booking form
   - `bookCalendarAppointment`: Creates the calendar event

2. **Component Rendering**:
   - Components are rendered in chat messages based on tool responses
   - User selections trigger follow-up messages to continue the flow

## Usage

```tsx
// Import components from the centralized location
import { DatePicker, TimePicker, AppointmentForm, Confirmation } from '@/components/calendar';

// Example usage in a component
<DatePicker 
  selectedDate={selectedDate}
  onDateSelect={handleDateSelect}
/>
```

## Styling Guidelines

All components:
1. Use shadcn/ui components for consistency
2. Follow the app's design system
3. Are responsive and mobile-friendly
4. Include accessibility features (ARIA attributes, keyboard navigation)
5. Use the `cn()` utility for conditional class names

## Type Definitions

All type definitions are centralized in `/lib/calendar/types.ts`, including:
- `AppointmentType`: Types of appointments (consultation, demo, support)
- `AppointmentFormData`: Form data structure
- `AppointmentData`: Complete appointment data
- `BookingResponse`: API response format 