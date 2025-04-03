import type { ToolDefinition } from '@/lib/tools/types';
import {
  getCalendarAvailability,
  getAvailableTimeSlots,
  prepareAppointmentForm,
  bookCalendarAppointment,
  searchCalendarEvents,
  cancelCalendarEvent,
} from '@/lib/ai/tools';
import { z } from 'zod';

/**
 * @deprecated - Calendar tools have been migrated to the AI SDK tools system
 * Please use tools exported from '/lib/ai/tools' instead.
 */

// Re-export the new tools for backward compatibility
export const tools: ToolDefinition[] = [
  {
    name: 'getCalendarAvailability',
    description: 'Get available time slots for a date',
    schema: z.object({
      date: z.string().optional(),
      appointmentType: z.string().optional(),
    }),
    execute: async () => {
      console.warn(
        'Using deprecated tools path. Please update imports to @/lib/ai/tools',
      );
      return { deprecated: true, status: 'error' };
    },
  },
  {
    name: 'bookAppointment',
    description: 'Book an appointment',
    schema: z.object({
      date: z.string(),
      timeSlot: z.string(),
      name: z.string(),
      email: z.string(),
    }),
    execute: async () => {
      console.warn(
        'Using deprecated tools path. Please update imports to @/lib/ai/tools',
      );
      return { deprecated: true, status: 'error' };
    },
  },
];

// Re-export for better transition
export {
  getCalendarAvailability,
  getAvailableTimeSlots,
  prepareAppointmentForm,
  bookCalendarAppointment,
  searchCalendarEvents,
  cancelCalendarEvent,
};
