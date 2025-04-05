import { z } from 'zod';
import {
  getCalendarToolset,
  processAvailability,
  convertTimeSlotToISO,
  processAvailableDates,
} from '@/lib/composio/calendar';
import {
  APPOINTMENT_TYPES,
  type AppointmentType,
  type BookingResponse,
  type ContextAwareAvailabilityResponse,
} from '@/lib/calendar/types';
import {
  createCalendarTool,
  appointmentTypeParam,
  dateParam,
  timeSlotParam,
  mockCalendarApi,
} from './calendar-tool-factory';

/**
 * Tool to get available appointment slots for a specific date and appointment type
 */
export const getCalendarAvailability = createCalendarTool({
  name: 'getCalendarAvailability',
  description: 'Get available appointment slots for a specific date and appointment type',
  parameters: z.object({
    appointmentType: appointmentTypeParam,
  }),
  execute: async ({ appointmentType }, context) => {
    const { toolset, calendarId } = await getCalendarToolset();
    
    // Get available dates from the real calendar API
    // Implementation would call the actual calendar API here
    const availableDates = await processAvailableDates({});
    
    // Return with explicit instructions for next steps
    return {
      appointmentType,
      date: '',
      availableSlots: [],
      availableDates,
      userInstructions: 'Please select a date from the calendar above to see available time slots.',
      nextAction: 'waitForDateSelection',
      nextTool: 'getAvailableTimeSlots',
    } as ContextAwareAvailabilityResponse;
  },
  mockExecute: async ({ appointmentType }, context) => {
    // Get mock available dates
    const availableDates = await mockCalendarApi.getAvailableDates(appointmentType);
    
    // Return mocked response
    return {
      appointmentType,
      date: '',
      availableSlots: [],
      availableDates,
      userInstructions: 'Please select a date from the calendar above to see available time slots.',
      nextAction: 'waitForDateSelection',
      nextTool: 'getAvailableTimeSlots',
    } as ContextAwareAvailabilityResponse;
  },
});

/**
 * Tool to get available time slots for a specific date
 */
export const getAvailableTimeSlots = createCalendarTool({
  name: 'getAvailableTimeSlots',
  description: 'Get available time slots for a specific date',
  parameters: z.object({
    date: dateParam,
    appointmentType: appointmentTypeParam.optional(),
  }),
  execute: async ({ date, appointmentType }, context) => {
    const { toolset, calendarId } = await getCalendarToolset();
    
    // Use appointment type from context if not provided in parameters
    const resolvedAppointmentType =
      appointmentType || context.appointmentType || 'consultation';
    
    // Get appointment duration for context
    const durationMinutes =
      APPOINTMENT_TYPES[resolvedAppointmentType as AppointmentType] || 30;
    
    // Implementation would call the actual calendar API here
    // const availableSlots = await processAvailability(result.data, resolvedAppointmentType);
    const availableSlots = await mockCalendarApi.getTimeSlots(date, resolvedAppointmentType as AppointmentType);

    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Create updated context
    const newContext = {
      ...context,
      currentStep: 'time',
      selectedDate: date,
      selectedTimeSlot: null,
      appointmentType: resolvedAppointmentType as AppointmentType,
    };
    
    return {
      date,
      formattedDate,
      availableSlots,
      appointmentType: resolvedAppointmentType,
      durationMinutes,
      userInstructions: `Please select a time slot for your ${resolvedAppointmentType} appointment on ${formattedDate}.`,
      nextAction: 'waitForTimeSelection',
      nextTool: 'prepareAppointmentForm',
      applicationContext: newContext,
    };
  },
  mockExecute: async ({ date, appointmentType }, context) => {
    // Use appointment type from context if not provided in parameters
    const resolvedAppointmentType =
      appointmentType || context.appointmentType || 'consultation';
    
    // Get available time slots from mock API
    const availableSlots = await mockCalendarApi.getTimeSlots(date, resolvedAppointmentType as AppointmentType);
    
    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Get appointment duration
    const durationMinutes =
      APPOINTMENT_TYPES[resolvedAppointmentType as AppointmentType] || 30;
    
    // Create updated context
    const newContext = {
      ...context,
      currentStep: 'time',
      selectedDate: date,
      selectedTimeSlot: null,
      appointmentType: resolvedAppointmentType as AppointmentType,
    };
    
    return {
      date,
      formattedDate,
      availableSlots,
      appointmentType: resolvedAppointmentType,
      durationMinutes,
      userInstructions: `Please select a time slot for your ${resolvedAppointmentType} appointment on ${formattedDate}.`,
      nextAction: 'waitForTimeSelection',
      nextTool: 'prepareAppointmentForm',
      applicationContext: newContext,
    };
  },
});

/**
 * Tool to prepare the appointment form
 */
export const prepareAppointmentForm = createCalendarTool({
  name: 'prepareAppointmentForm',
  description: 'Prepare the appointment form for a specific date and time',
  parameters: z.object({
    date: dateParam,
    timeSlot: timeSlotParam,
    appointmentType: appointmentTypeParam.optional(),
  }),
  execute: async ({ date, timeSlot, appointmentType }, context) => {
    // Use data from context if not provided in parameters
    const resolvedDate = date || context.selectedDate || '';
    const resolvedTimeSlot = timeSlot || context.selectedTimeSlot || '';
    const resolvedAppointmentType =
      appointmentType || context.appointmentType || 'consultation';
    
    // Format date for display
    const formattedDate = new Date(resolvedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Create updated context
    const newContext = {
      ...context,
      currentStep: 'details',
      selectedDate: resolvedDate,
      selectedTimeSlot: resolvedTimeSlot,
      appointmentType: resolvedAppointmentType as AppointmentType,
    };
    
    return {
      date: resolvedDate,
      timeSlot: resolvedTimeSlot,
      appointmentType: resolvedAppointmentType,
      formattedDate,
      userInstructions: `Please complete the form below to book your ${resolvedAppointmentType} appointment on ${formattedDate} at ${resolvedTimeSlot}.`,
      nextAction: 'waitForFormCompletion',
      nextTool: 'bookCalendarAppointment',
      applicationContext: newContext,
    };
  },
  mockExecute: async ({ date, timeSlot, appointmentType }, context) => {
    // Implementation is identical to execute since this doesn't require API calls
    return prepareAppointmentForm.execute({ date, timeSlot, appointmentType }, context);
  },
});

/**
 * Tool to book an appointment in the company calendar
 */
export const bookCalendarAppointment = createCalendarTool({
  name: 'bookCalendarAppointment',
  description: 'Book an appointment in the company calendar',
  parameters: z.object({
    date: dateParam,
    timeSlot: timeSlotParam,
    name: z.string().describe('Name of person booking'),
    email: z.string().email().describe('Email for appointment'),
    phone: z.string().describe('Phone number'),
    appointmentType: appointmentTypeParam.optional(),
    notes: z.string().optional().describe('Optional notes'),
  }),
  execute: async (params, context) => {
    const { toolset, calendarId } = await getCalendarToolset();
    
    // Use data from context if not provided in parameters
    const resolvedAppointmentType =
      params.appointmentType || context.appointmentType || 'consultation';
    
    // Get appointment duration
    const durationMinutes =
      APPOINTMENT_TYPES[resolvedAppointmentType as AppointmentType] || 30;
    
    // Real implementation would call the API
    // const result = await toolset.executeAction({
    //   action: 'GOOGLECALENDAR_CREATE_EVENT',
    //   params: {
    //     summary: `${resolvedAppointmentType} with ${params.name}`,
    //     description: params.notes || '',
    //     start_datetime: convertTimeSlotToISO(params.date, params.timeSlot),
    //     event_duration_minutes: durationMinutes,
    //     attendees: [params.email],
    //     send_updates: true,
    //     calendar_id: calendarId,
    //   },
    // });
    
    // Format date for display
    const formattedDate = new Date(params.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Create updated context
    const newContext = {
      ...context,
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
    console.log('Final calendar context:', newContext);
    
    // Return success response
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
      applicationContext: newContext,
    } as BookingResponse;
  },
  mockExecute: async (params, context) => {
    // Use appointment type from context if not provided
    const resolvedAppointmentType =
      params.appointmentType || context.appointmentType || 'consultation';
    
    // Call mock API to book appointment
    const result = await mockCalendarApi.bookAppointment({
      ...params,
      appointmentType: resolvedAppointmentType as AppointmentType,
    });
    
    // Format date for display
    const formattedDate = new Date(params.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Create updated context
    const newContext = {
      ...context,
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
    
    // Return success response
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
      applicationContext: newContext,
    } as BookingResponse;
  },
});

/**
 * Tool to search for calendar events
 */
export const searchCalendarEvents = createCalendarTool({
  name: 'searchCalendarEvents',
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
  execute: async (params, context) => {
    const { toolset, calendarId } = await getCalendarToolset();
    
    // Real implementation would call the API
    // Instead, we'll use the mock implementation for now
    return searchCalendarEvents.mockExecute(params, context);
  },
  mockExecute: async ({ query, email, startDate, endDate, maxResults = 5 }, context) => {
    // Call mock API to search events
    const events = await mockCalendarApi.searchEvents({
      query,
      email,
      startDate,
      endDate,
      maxResults,
    });
    
    // Create updated context
    const newContext = {
      ...context,
      currentStep: 'search',
    };
    
    return {
      success: true,
      events,
      query,
      totalEvents: events.length,
      userInstructions:
        events.length > 0
          ? `Found ${events.length} events matching your search criteria.`
          : `No events found matching "${query}". Try modifying your search or checking a different date range.`,
      applicationContext: newContext,
    };
  },
});

/**
 * Tool to cancel/delete a calendar event
 */
export const cancelCalendarEvent = createCalendarTool({
  name: 'cancelCalendarEvent',
  description: 'Cancel an existing appointment in the calendar',
  parameters: z.object({
    eventId: z.string().describe('ID of the event to cancel'),
    sendNotification: z
      .boolean()
      .optional()
      .describe('Whether to send cancellation notifications (default: true)'),
  }),
  execute: async ({ eventId, sendNotification = true }, context) => {
    const { toolset, calendarId } = await getCalendarToolset();
    
    // Real implementation would call the API
    // Instead, we'll use the mock implementation for now
    return cancelCalendarEvent.mockExecute({ eventId, sendNotification }, context);
  },
  mockExecute: async ({ eventId, sendNotification = true }, context) => {
    // Call mock API to cancel event
    const result = await mockCalendarApi.cancelEvent(eventId);
    
    // Create updated context
    const newContext = {
      ...context,
      currentStep: 'date', // Reset to date selection step after cancellation
    };
    
    return {
      success: result.success,
      eventId,
      canceled: result.success,
      notificationSent: sendNotification && result.success,
      userInstructions: result.success 
        ? `The appointment has been successfully cancelled${sendNotification ? ' and all attendees have been notified' : ''}.`
        : 'There was a problem cancelling the appointment. Please verify the appointment ID is correct or contact support for assistance.',
      applicationContext: newContext,
    };
  },
});