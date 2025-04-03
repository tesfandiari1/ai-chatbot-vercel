import { tool } from 'ai';
import { z } from 'zod';
import {
  getCalendarToolset,
  processAvailability,
  convertTimeSlotToISO,
  processAvailableDates,
  getDefaultTimeSlots,
} from '@/lib/composio/calendar';
import {
  APPOINTMENT_TYPES,
  type AppointmentType,
  type BookingResponse,
  type CalendarContext,
  type ToolContext,
  type ContextAwareAvailabilityResponse,
} from '@/lib/calendar/types';

// Shared parameters
const appointmentTypeParam = z
  .enum(['consultation', 'demo', 'support'])
  .describe('Type of appointment requested');

/**
 * Helper function to determine the next tool to call based on context
 */
function determineNextTool(context: CalendarContext): string | undefined {
  const { currentStep, selectedDate, selectedTimeSlot } = context;

  switch (currentStep) {
    case 'date':
      return selectedDate ? 'getAvailableTimeSlots' : undefined;
    case 'time':
      return selectedTimeSlot ? 'prepareAppointmentForm' : undefined;
    case 'details':
      return 'bookCalendarAppointment';
    case 'confirmation':
      return undefined;
    default:
      return undefined;
  }
}

/**
 * Tool to get available appointment slots for a specific date and appointment type
 */
export const getCalendarAvailability = tool({
  description:
    'Get available appointment slots for a specific date and appointment type',
  parameters: z.object({
    appointmentType: appointmentTypeParam,
  }),
  execute: async (
    { appointmentType },
    toolContext?: ToolContext,
  ): Promise<ContextAwareAvailabilityResponse> => {
    try {
      // Extract previous context if available
      const previousContext = toolContext?.applicationState?.previousSelections;

      // Format dates from today to the next week, skipping weekends
      const availableDates = [
        new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // Day after tomorrow
        new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      ]
        .filter((date) => {
          // Filter out weekends
          const d = new Date(date);
          return d.getDay() !== 0 && d.getDay() !== 6;
        })
        .slice(0, 5);

      // Create or update context
      const calendarContext: CalendarContext = {
        currentStep: 'date',
        selectedDate: null,
        selectedTimeSlot: null,
        appointmentType,
        ...(previousContext || {}),
      };

      // Return with explicit instructions for next steps
      return {
        appointmentType,
        date: '',
        availableSlots: [],
        availableDates,
        userInstructions:
          'Please select a date from the calendar above to see available time slots.',
        nextAction: 'waitForDateSelection',
        applicationContext: calendarContext,
        nextTool: undefined,
      };
    } catch (error) {
      console.error('Error in getCalendarAvailability:', error);
      return {
        appointmentType,
        date: '',
        availableSlots: [],
        error: 'Unable to fetch available dates. Please try again.',
        userInstructions:
          'There was a problem loading the calendar. Please try again or specify a date directly.',
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
    date: z.string().describe('Date in YYYY-MM-DD format'),
    appointmentType: appointmentTypeParam.optional(),
  }),
  execute: async ({ date, appointmentType }, toolContext?: ToolContext) => {
    try {
      const { toolset, calendarId } = await getCalendarToolset();

      // Extract previous context if available
      const previousContext = toolContext?.applicationState?.previousSelections;

      // Use appointment type from context if not provided in parameters
      const resolvedAppointmentType =
        appointmentType || previousContext?.appointmentType || 'consultation';

      // Get appointment duration for context
      const durationMinutes =
        APPOINTMENT_TYPES[resolvedAppointmentType as AppointmentType] || 30;

      // Generate time slots for the selected date
      const availableSlots = getDefaultTimeSlots();

      // Format date for display
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Create a new context with safe defaults
      const calendarContext: CalendarContext = {
        currentStep: 'time',
        selectedDate: date,
        selectedTimeSlot: null, // Will be selected in the next step
        appointmentType: resolvedAppointmentType as AppointmentType,
      };

      // Copy over previous values if they exist
      if (previousContext) {
        if (previousContext.formData)
          calendarContext.formData = previousContext.formData;
        if (previousContext.autoAdvance !== undefined)
          calendarContext.autoAdvance = previousContext.autoAdvance;
        if (previousContext.error)
          calendarContext.error = previousContext.error;
      }

      return {
        date,
        formattedDate,
        availableSlots,
        appointmentType: resolvedAppointmentType,
        durationMinutes,
        userInstructions: `Please select a time slot for your ${resolvedAppointmentType} appointment on ${formattedDate}.`,
        nextAction: 'waitForTimeSelection',
        applicationContext: calendarContext,
        nextTool: undefined,
      };
    } catch (error) {
      console.error('Error in getAvailableTimeSlots:', error);
      return {
        date,
        availableSlots: getDefaultTimeSlots(),
        appointmentType: appointmentType || 'consultation',
        userInstructions:
          'There was a problem loading time slots. Please select a time from the options above or specify a time directly.',
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
    date: z.string().describe('Date in YYYY-MM-DD format'),
    timeSlot: z.string().describe('Time slot (e.g. "2:00pm")'),
    appointmentType: appointmentTypeParam.optional(),
  }),
  execute: async (
    { date, timeSlot, appointmentType },
    toolContext?: ToolContext,
  ) => {
    // Extract previous context if available
    const previousContext = toolContext?.applicationState?.previousSelections;

    // Use data from context if not provided in parameters
    const resolvedDate = date || previousContext?.selectedDate || '';
    const resolvedTimeSlot =
      timeSlot || previousContext?.selectedTimeSlot || '';
    const resolvedAppointmentType =
      appointmentType || previousContext?.appointmentType || 'consultation';

    // Format date for display
    const formattedDate = new Date(resolvedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create a new context with safe defaults
    const calendarContext: CalendarContext = {
      currentStep: 'details',
      selectedDate: resolvedDate,
      selectedTimeSlot: resolvedTimeSlot,
      appointmentType: resolvedAppointmentType as AppointmentType,
    };

    // Copy over previous values if they exist
    if (previousContext) {
      if (previousContext.formData)
        calendarContext.formData = previousContext.formData;
      if (previousContext.autoAdvance !== undefined)
        calendarContext.autoAdvance = previousContext.autoAdvance;
      if (previousContext.error) calendarContext.error = previousContext.error;
    }

    return {
      date: resolvedDate,
      timeSlot: resolvedTimeSlot,
      appointmentType: resolvedAppointmentType,
      formattedDate,
      userInstructions: `Please complete the form below to book your ${resolvedAppointmentType} appointment on ${formattedDate} at ${resolvedTimeSlot}.`,
      nextAction: 'waitForFormCompletion',
      applicationContext: calendarContext,
      nextTool: undefined,
    };
  },
});

/**
 * Tool to book an appointment in the company calendar
 */
export const bookCalendarAppointment = tool({
  description: 'Book an appointment in the company calendar',
  parameters: z.object({
    date: z.string().describe('Date in YYYY-MM-DD format'),
    timeSlot: z.string().describe('Time slot (e.g. "2:00pm")'),
    name: z.string().describe('Name of person booking'),
    email: z.string().email().describe('Email for appointment'),
    phone: z.string().describe('Phone number'),
    appointmentType: appointmentTypeParam.optional(),
    notes: z.string().optional().describe('Optional notes'),
  }),
  execute: async (
    params,
    toolContext?: ToolContext,
  ): Promise<BookingResponse> => {
    try {
      const { toolset, calendarId } = await getCalendarToolset();

      // Extract previous context if available
      const previousContext = toolContext?.applicationState?.previousSelections;

      // Use data from context if not provided in parameters
      const resolvedAppointmentType =
        params.appointmentType ||
        previousContext?.appointmentType ||
        'consultation';

      // Get appointment duration
      const durationMinutes =
        APPOINTMENT_TYPES[resolvedAppointmentType as AppointmentType] || 30;

      // For real integration, uncomment:
      /*
      const result = await toolset.executeAction({
        action: 'GOOGLECALENDAR_CREATE_EVENT',
        params: {
          summary: `${resolvedAppointmentType} with ${params.name}`,
          description: params.notes || '',
          start_datetime: convertTimeSlotToISO(params.date, params.timeSlot),
          event_duration_minutes: durationMinutes,
          attendees: [params.email],
          send_updates: true,
          calendar_id: calendarId,
        },
      });
      */

      // Format date for display
      const formattedDate = new Date(params.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Store context but don't return it in the response
      // since BookingResponse doesn't include applicationContext
      const calendarContext: CalendarContext = {
        currentStep: 'confirmation',
        selectedDate: params.date,
        selectedTimeSlot: params.timeSlot,
        appointmentType: resolvedAppointmentType as AppointmentType,
        formData: {
          name: params.name,
          email: params.email,
          phone: params.phone,
          notes: params.notes,
        },
      };

      // For debugging
      console.log('Final calendar context:', calendarContext);

      // Demo/testing response
      return {
        success: true,
        appointment: {
          date: params.date,
          timeSlot: params.timeSlot,
          appointmentType: resolvedAppointmentType as AppointmentType,
          name: params.name,
          email: params.email,
          phone: params.phone,
          notes: params.notes,
        },
        userInstructions: `Great! Your ${resolvedAppointmentType} appointment has been scheduled for ${formattedDate} at ${params.timeSlot}. A confirmation email has been sent to ${params.email}.`,
        nextAction: 'appointmentConfirmed',
      };
    } catch (error) {
      console.error('Error in bookCalendarAppointment:', error);
      return {
        success: false,
        error: 'Failed to schedule appointment',
        userInstructions:
          "I couldn't schedule your appointment due to a technical issue. Please try again or contact support for assistance.",
      };
    }
  },
});

/**
 * Tool to search for calendar events
 * Implements Phase 4.1: Event search functionality
 */
export const searchCalendarEvents = tool({
  description: 'Search for existing appointments or events in the calendar',
  parameters: z.object({
    query: z.string().describe('Search term to find matching events'),
    email: z
      .string()
      .email()
      .optional()
      .describe('Optional: Filter events by attendee email'),
    startDate: z
      .string()
      .optional()
      .describe('Optional: Lower bound for event dates in YYYY-MM-DD format'),
    endDate: z
      .string()
      .optional()
      .describe('Optional: Upper bound for event dates in YYYY-MM-DD format'),
    maxResults: z
      .number()
      .optional()
      .describe('Optional: Maximum number of events to return (default: 5)'),
  }),
  execute: async ({ query, email, startDate, endDate, maxResults = 5 }) => {
    try {
      const { toolset, calendarId } = await getCalendarToolset();

      console.log(`Searching calendar events with query: ${query}`);

      // Prepare search parameters for Composio
      const searchParams: Record<string, any> = {
        calendar_id: calendarId,
        query: query,
        max_results: maxResults,
        single_events: true,
      };

      // Add optional date filters if provided
      if (startDate) {
        // Convert YYYY-MM-DD to ISO format for Composio API
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        searchParams.timeMin = startDateTime.toISOString();
      }

      if (endDate) {
        // Convert YYYY-MM-DD to ISO format for Composio API
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        searchParams.timeMax = endDateTime.toISOString();
      }

      // Execute the search (comment out for now until integration is complete)
      /*
      const result = await toolset.executeAction({
        action: 'GOOGLECALENDAR_FIND_EVENT',
        params: searchParams,
      });
      
      // Process the search results
      const events = result.data.items || [];
      */

      // Mock results for development/testing
      const mockEvents = [
        {
          id: 'event1',
          summary: 'Consultation with Jane Smith',
          start: {
            dateTime: '2023-05-15T10:00:00-04:00',
          },
          end: {
            dateTime: '2023-05-15T10:30:00-04:00',
          },
          attendees: [{ email: 'jane@example.com' }],
        },
        {
          id: 'event2',
          summary: 'Demo with Acme Corp',
          start: {
            dateTime: '2023-05-16T14:00:00-04:00',
          },
          end: {
            dateTime: '2023-05-16T14:45:00-04:00',
          },
          attendees: [{ email: 'john@acme.com' }],
        },
      ];

      // Filter by email if provided
      const filteredEvents = email
        ? mockEvents.filter((event) =>
            event.attendees?.some((attendee) => attendee.email === email),
          )
        : mockEvents;

      // Format the events for display
      const formattedEvents = filteredEvents.map((event) => {
        const startTime = new Date(event.start.dateTime);
        const endTime = new Date(event.end.dateTime);

        return {
          id: event.id,
          title: event.summary,
          date: startTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          time: `${startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })} - ${endTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}`,
          attendees: event.attendees?.map((a) => a.email).join(', '),
        };
      });

      return {
        success: true,
        events: formattedEvents,
        query,
        totalEvents: formattedEvents.length,
        userInstructions:
          formattedEvents.length > 0
            ? `Found ${formattedEvents.length} events matching your search criteria.`
            : `No events found matching "${query}". Try modifying your search or checking a different date range.`,
      };
    } catch (error) {
      console.error('Error searching calendar events:', error);
      return {
        success: false,
        events: [],
        error: 'Failed to search calendar events',
        userInstructions:
          'There was a problem searching the calendar. Please try again with different search terms or contact support for assistance.',
      };
    }
  },
});

/**
 * Tool to cancel/delete a calendar event
 * Implements Phase 4.2: Event management (delete) functionality
 */
export const cancelCalendarEvent = tool({
  description: 'Cancel an existing appointment in the calendar',
  parameters: z.object({
    eventId: z.string().describe('ID of the event to cancel'),
    sendNotification: z
      .boolean()
      .optional()
      .describe('Whether to send cancellation notifications (default: true)'),
  }),
  execute: async ({ eventId, sendNotification = true }) => {
    try {
      const { toolset, calendarId } = await getCalendarToolset();

      console.log(`Cancelling calendar event with ID: ${eventId}`);

      // For real integration, uncomment:
      /*
      await toolset.executeAction({
        action: 'GOOGLECALENDAR_DELETE_EVENT',
        params: {
          calendar_id: calendarId,
          event_id: eventId,
          send_updates: sendNotification ? 'all' : 'none',
        },
      });
      */

      // Mock implementation for now
      const mockSuccessful = eventId === 'event1' || eventId === 'event2';

      if (!mockSuccessful) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      return {
        success: true,
        eventId,
        canceled: true,
        notificationSent: sendNotification,
        userInstructions: `The appointment has been successfully cancelled${sendNotification ? ' and all attendees have been notified' : ''}.`,
      };
    } catch (error) {
      console.error('Error cancelling calendar event:', error);
      return {
        success: false,
        eventId,
        canceled: false,
        error: 'Failed to cancel the appointment',
        userInstructions:
          'There was a problem cancelling the appointment. Please verify the appointment ID is correct or contact support for assistance.',
      };
    }
  },
});

// We'll implement the tool composition in a separate file
// since composeTools functionality needs to be custom implemented
