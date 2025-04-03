import { tool } from 'ai';
import { z } from 'zod';
import {
  getCalendarToolset,
  processAvailability,
  convertTimeSlotToISO,
} from '@/lib/composio/calendar';
import {
  APPOINTMENT_TYPES,
  type AppointmentType,
  type BookingResponse,
} from '@/lib/calendar/types';

/**
 * Tool to get available appointment slots for a specific date
 */
export const getCalendarAvailability = tool({
  description:
    'Get available appointment slots for a specific date and appointment type',
  parameters: z.object({
    appointmentType: z
      .enum(['consultation', 'demo', 'support'])
      .describe('Type of appointment requested'),
  }),
  execute: async ({ appointmentType }) => {
    try {
      return {
        appointmentType,
      };
    } catch (error) {
      console.error('Error fetching calendar availability', error);
      return {
        error: 'Failed to fetch availability',
      };
    }
  },
});

/**
 * Tool to get available time slots for a specific date
 */
export const getAvailableTimeSlots = tool({
  description: 'Get available time slots for a specific date',
  parameters: z.object({
    date: z
      .string()
      .describe(
        'The date for which to check availability, in YYYY-MM-DD format',
      ),
    appointmentType: z
      .enum(['consultation', 'demo', 'support'])
      .describe('Type of appointment requested'),
  }),
  execute: async ({ date, appointmentType }) => {
    try {
      const { toolset, calendarId } = await getCalendarToolset();

      // Call Google Calendar API via Composio
      const result = await toolset.executeAction({
        action: 'GOOGLECALENDAR_FIND_FREE_SLOTS',
        params: {
          time_min: `${date}T00:00:00Z`,
          time_max: `${date}T23:59:59Z`,
          calendar_id: calendarId,
        },
      });

      // Process and return available slots
      const availableSlots = processAvailability(result?.data, appointmentType);

      return {
        date,
        availableSlots,
        appointmentType,
      };
    } catch (error) {
      console.error('Error fetching time slots', error);
      return {
        error: 'Failed to fetch time slots',
        date,
        availableSlots: [],
      };
    }
  },
});

/**
 * Tool to prepare the appointment form
 */
export const prepareAppointmentForm = tool({
  description: 'Prepare the appointment form for a specific date and time',
  parameters: z.object({
    date: z
      .string()
      .describe('The date for the appointment, in YYYY-MM-DD format'),
    timeSlot: z
      .string()
      .describe('The time slot for the appointment, e.g. "2:00pm"'),
    appointmentType: z
      .enum(['consultation', 'demo', 'support'])
      .describe('Type of appointment'),
  }),
  execute: async ({ date, timeSlot, appointmentType }) => {
    return {
      date,
      timeSlot,
      appointmentType,
    };
  },
});

/**
 * Tool to book an appointment in the company calendar
 */
export const bookCalendarAppointment = tool({
  description: 'Book an appointment in the company calendar',
  parameters: z.object({
    date: z
      .string()
      .describe('The date for the appointment, in YYYY-MM-DD format'),
    timeSlot: z
      .string()
      .describe('The time slot for the appointment, e.g. "2:00pm"'),
    name: z.string().describe('The name of the person booking the appointment'),
    email: z.string().email().describe('The email address for the appointment'),
    phone: z.string().describe('The phone number for the appointment'),
    appointmentType: z
      .enum(['consultation', 'demo', 'support'])
      .describe('Type of appointment'),
    notes: z.string().optional().describe('Optional notes for the appointment'),
  }),
  execute: async (params): Promise<BookingResponse> => {
    try {
      const { toolset, calendarId } = await getCalendarToolset();

      // Get duration based on appointment type
      const durationMinutes =
        APPOINTMENT_TYPES[params.appointmentType as AppointmentType] || 30;

      // Create calendar event with appointment type in title
      const result = await toolset.executeAction({
        action: 'GOOGLECALENDAR_CREATE_EVENT',
        params: {
          summary: `${params.appointmentType} with ${params.name}`,
          description: params.notes || '',
          start_datetime: convertTimeSlotToISO(params.date, params.timeSlot),
          event_duration_minutes: durationMinutes,
          attendees: [params.email],
          send_updates: true,
          calendar_id: calendarId,
        },
      });

      return {
        success: true,
        appointment: {
          date: params.date,
          timeSlot: params.timeSlot,
          appointmentType: params.appointmentType as AppointmentType,
          name: params.name,
          email: params.email,
          phone: params.phone,
          notes: params.notes,
        },
      };
    } catch (error) {
      console.error('Error booking appointment', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to schedule appointment',
      };
    }
  },
});
