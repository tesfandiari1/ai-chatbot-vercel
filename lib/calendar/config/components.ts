/**
 * Calendar Component Mapping
 *
 * This file maps each booking step to its corresponding component.
 * Separating this mapping makes the architecture more maintainable.
 */

import type { ComponentType } from 'react';
import type { BookingStep } from '../types';

// Import components - these imports need to be changed to the actual components
import { DatePicker } from '@/components/calendar/DatePicker';
import { TimePicker } from '@/components/calendar/TimePicker';
import { AppointmentForm } from '@/components/calendar/AppointmentForm';
import { Confirmation } from '@/components/calendar/Confirmation';
import { EventSearchResults } from '@/components/calendar/EventSearchResults';

/**
 * Maps each booking step to its corresponding component
 */
export const STEP_TO_COMPONENT: Record<BookingStep, ComponentType<any>> = {
  date: DatePicker,
  time: TimePicker,
  details: AppointmentForm,
  confirmation: Confirmation,
  search: EventSearchResults,
};

/**
 * Get the component for a specific booking step
 */
export function getStepComponent(step: BookingStep): ComponentType<any> {
  return STEP_TO_COMPONENT[step] || STEP_TO_COMPONENT.date;
}
