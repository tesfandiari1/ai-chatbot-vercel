/**
 * Calendar Tool Factory
 * 
 * Provides a consistent way to create calendar tools with proper typings,
 * standardized error handling, and shared utility functions.
 * Supports both AI SDK and MCP execution modes.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { getCalendarToolset } from '@/lib/composio/calendar';
import type { ToolContext, AppointmentType } from '@/lib/calendar/types';

// Enable real calendar API integration if specified in environment
const USE_REAL_CALENDAR = process.env.USE_REAL_CALENDAR === 'true';

// Enable MCP integration if specified in environment
const USE_MCP = process.env.USE_MCP === 'true';

/**
 * Shared parameter schemas for consistency across tool definitions
 */
export const appointmentTypeParam = z
  .enum(['consultation', 'demo', 'support'])
  .describe('Type of appointment requested');

export const dateParam = z
  .string()
  .describe('Date in YYYY-MM-DD format');

export const timeSlotParam = z
  .string()
  .describe('Time slot (e.g. "2:00pm")');

/**
 * Standardized error response formatter
 */
export function formatToolError(error: unknown, defaultMessage: string): any {
  console.error('Calendar tool error:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : defaultMessage,
    userInstructions: 'There was a problem processing your request. Please try again or contact support for assistance.',
  };
}

/**
 * Extract context from tool execution options
 */
export function getToolContext(toolContext?: ToolContext): Record<string, any> {
  return toolContext?.applicationState?.previousSelections || {
    currentStep: 'date',
    appointmentType: 'consultation',
  };
}

/**
 * Creates a mock calendar API client for testing and development
 */
export function createMockCalendarAPI() {
  return {
    getAvailableDates: async (appointmentType: AppointmentType): Promise<string[]> => {
      // Return dates from today to the next week, skipping weekends
      return [
        new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // Day after tomorrow
        new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      ].filter((date) => {
        // Filter out weekends
        const d = new Date(date);
        return d.getDay() !== 0 && d.getDay() !== 6;
      }).slice(0, 5);
    },
    
    getTimeSlots: async (date: string, appointmentType: AppointmentType): Promise<string[]> => {
      return [
        '9:00am', '9:30am', '10:00am', '10:30am', '11:00am', '11:30am',
        '1:00pm', '1:30pm', '2:00pm', '2:30pm', '3:00pm', '3:30pm', '4:00pm', '4:30pm',
      ];
    },
    
    bookAppointment: async (params: {
      date: string;
      timeSlot: string;
      name: string;
      email: string;
      phone: string;
      notes?: string;
      appointmentType: AppointmentType;
    }): Promise<{
      success: boolean;
      appointmentId: string;
      message: string;
    }> => {
      return {
        success: true,
        appointmentId: `mock-${Date.now()}`,
        message: `Appointment booked successfully for ${params.date} at ${params.timeSlot}`,
      };
    },
    
    searchEvents: async (params: {
      query: string;
      email?: string;
      startDate?: string;
      endDate?: string;
      maxResults?: number;
    }): Promise<any[]> => {
      return [
        {
          id: 'event1',
          title: 'Consultation with Jane Smith',
          date: 'Tuesday, May 15, 2023',
          time: '10:00 AM - 10:30 AM',
          attendees: 'jane@example.com',
        },
        {
          id: 'event2',
          title: 'Demo with Acme Corp',
          date: 'Wednesday, May 16, 2023',
          time: '2:00 PM - 2:45 PM',
          attendees: 'john@acme.com',
        },
      ];
    },
    
    cancelEvent: async (eventId: string): Promise<{
      success: boolean;
      message: string;
    }> => {
      const validIds = ['event1', 'event2'];
      return {
        success: validIds.includes(eventId),
        message: validIds.includes(eventId)
          ? `Event ${eventId} cancelled successfully.`
          : `Event ${eventId} not found.`,
      };
    },
  };
}

/**
 * Create a calendar tool with consistent structure and error handling
 * Supports both AI SDK and MCP execution
 */
export function createCalendarTool<Params, Result>({
  name,
  description,
  parameters,
  execute,
  mockExecute,
}: {
  name: string;
  description: string;
  parameters: z.ZodType<Params>;
  execute: (params: Params, context: Record<string, any>) => Promise<Result>;
  mockExecute: (params: Params, context: Record<string, any>) => Promise<Result>;
}) {
  // Create a unified execution function that handles context and error handling
  const executeWithContext = async (params: Params, toolContext?: ToolContext): Promise<Result> => {
    try {
      // Get context from tool execution options
      const context = getToolContext(toolContext);
      
      // Execute the tool with the appropriate implementation
      const result = USE_REAL_CALENDAR 
        ? await execute(params, context)
        : await mockExecute(params, context);
      
      // Add context to the result
      return {
        ...result,
        applicationContext: context,
      } as Result;
    } catch (error) {
      return formatToolError(error, `Failed to execute ${name}`) as unknown as Result;
    }
  };

  // Create the AI SDK tool
  return tool({
    name,
    description,
    parameters,
    execute: executeWithContext
  });
}

/**
 * Get schemas for all calendar tools
 * Used for registering with MCP server
 */
export function getCalendarToolSchemas() {
  return {
    getCalendarAvailability: {
      description: 'Get available dates for a specific appointment type',
      arguments: {
        appointmentType: {
          type: 'string',
          description: 'Type of appointment requested (consultation, demo, support)',
          enum: ['consultation', 'demo', 'support'],
        },
      },
    },
    getAvailableTimeSlots: {
      description: 'Get available time slots for a specific date and appointment type',
      arguments: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        appointmentType: {
          type: 'string',
          description: 'Type of appointment requested (consultation, demo, support)',
          enum: ['consultation', 'demo', 'support'],
          optional: true,
        },
      },
    },
    prepareAppointmentForm: {
      description: 'Prepare a form for scheduling an appointment on a specific date and time',
      arguments: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        timeSlot: {
          type: 'string',
          description: 'Time slot (e.g. "2:00pm")',
        },
        appointmentType: {
          type: 'string',
          description: 'Type of appointment requested (consultation, demo, support)',
          enum: ['consultation', 'demo', 'support'],
          optional: true,
        },
      },
    },
    bookCalendarAppointment: {
      description: 'Book a calendar appointment with the provided details',
      arguments: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        timeSlot: {
          type: 'string',
          description: 'Time slot (e.g. "2:00pm")',
        },
        name: {
          type: 'string',
          description: 'Name of the person booking the appointment',
        },
        email: {
          type: 'string',
          description: 'Email address for the appointment',
        },
        phone: {
          type: 'string',
          description: 'Phone number for the appointment',
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the appointment (optional)',
          optional: true,
        },
        appointmentType: {
          type: 'string',
          description: 'Type of appointment requested (consultation, demo, support)',
          enum: ['consultation', 'demo', 'support'],
          optional: true,
        },
      },
    },
    searchCalendarEvents: {
      description: 'Search calendar events by query string or email',
      arguments: {
        query: {
          type: 'string',
          description: 'Search query for calendar events',
        },
        email: {
          type: 'string',
          description: 'Email to filter events by (optional)',
          optional: true,
        },
        startDate: {
          type: 'string',
          description: 'Start date for date range search (YYYY-MM-DD format, optional)',
          optional: true,
        },
        endDate: {
          type: 'string',
          description: 'End date for date range search (YYYY-MM-DD format, optional)',
          optional: true,
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (optional)',
          optional: true,
        },
      },
    },
    cancelCalendarEvent: {
      description: 'Cancel a calendar event by ID',
      arguments: {
        eventId: {
          type: 'string',
          description: 'ID of the event to cancel',
        },
      },
    },
  };
}

/**
 * Register calendar tools with an MCP server
 * This attaches the calendar tools to an MCP server instance
 */
export function registerCalendarToolsWithMCP(server: any) {
  // Get the appropriate calendar API implementation
  const calendarAPI = USE_REAL_CALENDAR 
    ? getCalendarToolset() 
    : createMockCalendarAPI();
  
  // Add validation schemas using Zod
  const schemas = {
    getCalendarAvailability: {
      appointmentType: appointmentTypeParam,
    },
    getAvailableTimeSlots: {
      date: dateParam,
      appointmentType: appointmentTypeParam.optional(),
    },
    prepareAppointmentForm: {
      date: dateParam,
      timeSlot: timeSlotParam,
      appointmentType: appointmentTypeParam.optional(),
    },
    bookCalendarAppointment: {
      date: dateParam,
      timeSlot: timeSlotParam,
      name: z.string().min(2, 'Name must have at least 2 characters'),
      email: z.string().email('Please enter a valid email address'),
      phone: z.string().min(5, 'Phone number must have at least 5 characters'),
      notes: z.string().optional(),
      appointmentType: appointmentTypeParam.optional(),
    },
    searchCalendarEvents: {
      query: z.string().min(1, 'Search query cannot be empty'),
      email: z.string().email('Please enter a valid email address').optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      maxResults: z.number().positive().optional(),
    },
    cancelCalendarEvent: {
      eventId: z.string().min(1, 'Event ID cannot be empty'),
    },
  };
  
  // Register getCalendarAvailability tool
  server.tool(
    'getCalendarAvailability',
    schemas.getCalendarAvailability,
    async ({ appointmentType }, context: any) => {
      try {
        // Extract previous context if available
        const previousContext = context?.applicationState?.previousSelections || {};
        const toolContext = { ...previousContext, currentStep: 'date' };
        
        // Call the appropriate implementation
        const dates = await calendarAPI.getAvailableDates(appointmentType);
        
        // Format the result
        return {
          success: true,
          appointmentType,
          availableDates: dates,
          applicationContext: toolContext,
          userInstructions: `Please select a date for your ${appointmentType} appointment.`,
        };
      } catch (error) {
        return formatToolError(error, 'Failed to get available dates');
      }
    }
  );

  // Register getAvailableTimeSlots tool
  server.tool(
    'getAvailableTimeSlots',
    schemas.getAvailableTimeSlots,
    async ({ date, appointmentType = 'consultation' }, context: any) => {
      try {
        // Extract previous context
        const previousContext = context?.applicationState?.previousSelections || {};
        const toolContext = { 
          ...previousContext, 
          currentStep: 'time',
          selectedDate: date,
          appointmentType,
        };
        
        // Call implementation
        const timeSlots = await calendarAPI.getTimeSlots(date, appointmentType);
        
        return {
          success: true,
          date,
          appointmentType,
          availableSlots: timeSlots,
          applicationContext: toolContext,
          userInstructions: `Please select a time for your appointment on ${date}.`,
        };
      } catch (error) {
        return formatToolError(error, 'Failed to get available time slots');
      }
    }
  );

  // Register prepareAppointmentForm tool
  server.tool(
    'prepareAppointmentForm',
    schemas.prepareAppointmentForm,
    async ({ date, timeSlot, appointmentType = 'consultation' }, context: any) => {
      try {
        // Extract previous context
        const previousContext = context?.applicationState?.previousSelections || {};
        const toolContext = { 
          ...previousContext, 
          currentStep: 'details',
          selectedDate: date,
          selectedTimeSlot: timeSlot,
          appointmentType,
        };
        
        return {
          success: true,
          date,
          timeSlot,
          appointmentType,
          applicationContext: toolContext,
          userInstructions: `Please fill out the form to complete your booking for ${date} at ${timeSlot}.`,
        };
      } catch (error) {
        return formatToolError(error, 'Failed to prepare appointment form');
      }
    }
  );

  // Add more tool registrations as needed...
}