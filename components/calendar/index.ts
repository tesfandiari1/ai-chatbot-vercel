/**
 * Calendar Component Exports
 *
 * This file provides a clean public API for the calendar components.
 * External code should import from this file rather than directly from component files.
 */

// Main Components
export { AppointmentFlow } from './AppointmentFlow';
export { CalendarToolResult } from './ToolResult';
export { DatePicker } from './DatePicker';
export { TimePicker } from './TimePicker';
export { AppointmentForm } from './AppointmentForm';
export { Confirmation } from './Confirmation';
export { EventSearchResults } from './EventSearchResults';

// UI Components
export {
  CalendarContainer,
  CalendarLoader,
  TimeSlotsLoader,
  FormLoader,
  CalendarSpinner,
  SubmittingIndicator,
  getChatFunctions,
} from './ui-components';

// Export type definitions
export type { BookingStep } from '@/lib/calendar/types';
