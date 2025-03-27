import { z } from 'zod';
import type { ToolDefinition } from '@/lib/tools/types';
import {
  composioToolset,
  handleToolCalls as handleToolCall,
  initializeCalendarTools,
} from '@/lib/composio/config';
import { OpenAI } from 'openai';
import { getOAuthToken } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

// Define types for time slots
interface TimeSlot {
  startTime: string;
  endTime: string;
  meetingTypeId: string;
}

// Define type for Composio response
interface ComposioResponse {
  successful?: boolean;
  data?: {
    id?: string;
    htmlLink?: string;
    [key: string]: any;
  };
  error?: string;
}

// Initialize OpenAI client for making API calls with tool choice
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || undefined,
});

/**
 * Helper function to get the Composio connection ID for the current user
 */
async function getComposioConnectionId(): Promise<string | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error('No user found in session');
      return null;
    }

    const token = await getOAuthToken(session.user.id, 'google_calendar');
    if (!token?.composioConnectionId) {
      console.error('No Composio connection ID found for user');
      return null;
    }

    return token.composioConnectionId;
  } catch (error) {
    console.error('Error getting Composio connection ID:', error);
    return null;
  }
}

/**
 * Tool for checking calendar availability for a specific date range
 * Uses Composio's GOOGLECALENDAR_FIND_FREE_SLOTS action
 */
export const checkCalendarAvailability: ToolDefinition = {
  name: 'checkCalendarAvailability',
  description:
    'Check available time slots on Google Calendar for a specific date',
  schema: z.object({
    date: z
      .string()
      .describe('The date to check availability for (ISO format)'),
    timeZone: z
      .string()
      .describe(
        'The timezone for availability checking (e.g., America/Los_Angeles)',
      ),
    duration: z
      .number()
      .optional()
      .describe('Meeting duration in minutes (default: 30)'),
  }),
  execute: async ({ date, timeZone, duration = 30 }) => {
    try {
      // Get the Composio connection ID for the current user
      const connectionId = await getComposioConnectionId();

      // If no connection ID found, return an error
      if (!connectionId) {
        return {
          status: 'error',
          message:
            'Google Calendar not connected. Please connect your calendar first.',
          needsAuth: true,
        };
      }

      // Parse the date into the format expected by Composio
      const dateObj = new Date(date);
      const timeMin = new Date(dateObj);
      timeMin.setHours(9, 0, 0); // Start at 9 AM

      const timeMax = new Date(dateObj);
      timeMax.setHours(18, 0, 0); // End at 6 PM

      // Convert to ISO strings for the API
      const timeMinString = timeMin.toISOString();
      const timeMaxString = timeMax.toISOString();

      console.log(
        `Checking availability from ${timeMinString} to ${timeMaxString} in ${timeZone}`,
      );

      // Use Composio to execute the action directly
      const result = await composioToolset.executeAction({
        action: 'GOOGLECALENDAR_FIND_FREE_SLOTS',
        params: {
          time_min: timeMinString,
          time_max: timeMaxString,
          timezone: timeZone,
        },
        connectedAccountId: connectionId,
      });

      // Process the result into available time slots
      const availableSlots = processAvailableSlots(result, duration);

      return {
        status: 'success',
        availableSlots,
      };
    } catch (error) {
      console.error('Error checking calendar availability:', error);
      return {
        status: 'error',
        message: 'Failed to check calendar availability',
      };
    }
  },
};

// Helper function to process calendar availability results
function processAvailableSlots(
  rawResult: ComposioResponse,
  duration: number,
): TimeSlot[] {
  try {
    // This is a placeholder implementation
    // The actual processing would depend on the response format from Composio

    // If no real data is available, return mock data for development
    if (!rawResult || !rawResult.successful) {
      return duration === 30
        ? [
            {
              startTime: '5:00pm',
              endTime: '5:30pm',
              meetingTypeId: '30min',
            },
            {
              startTime: '5:30pm',
              endTime: '6:00pm',
              meetingTypeId: '30min',
            },
          ]
        : [
            {
              startTime: '6:00pm',
              endTime: '7:00pm',
              meetingTypeId: '60min',
            },
            {
              startTime: '7:00pm',
              endTime: '8:00pm',
              meetingTypeId: '60min',
            },
          ];
    }

    // TODO: Implement real processing logic based on Composio response format
    // Example implementation for processing real data
    // Adapt based on actual response format
    const freeSlots: TimeSlot[] = [];

    // If no slots processed, return the mock data
    if (freeSlots.length === 0) {
      return duration === 30
        ? [
            {
              startTime: '5:00pm',
              endTime: '5:30pm',
              meetingTypeId: '30min',
            },
            {
              startTime: '5:30pm',
              endTime: '6:00pm',
              meetingTypeId: '30min',
            },
          ]
        : [
            {
              startTime: '6:00pm',
              endTime: '7:00pm',
              meetingTypeId: '60min',
            },
            {
              startTime: '7:00pm',
              endTime: '8:00pm',
              meetingTypeId: '60min',
            },
          ];
    }

    return freeSlots;
  } catch (error) {
    console.error('Error processing available slots:', error);
    return [];
  }
}

/**
 * Tool for creating a calendar event
 * Uses Composio's GOOGLECALENDAR_CREATE_EVENT action
 */
export const createCalendarEvent: ToolDefinition = {
  name: 'createCalendarEvent',
  description: 'Create a new event on Google Calendar',
  schema: z.object({
    summary: z.string().describe('Event title/summary'),
    description: z.string().optional().describe('Event description/notes'),
    startDateTime: z.string().describe('Start date and time (ISO format)'),
    duration: z.number().describe('Duration in minutes'),
    timeZone: z
      .string()
      .describe('Timezone for the event (e.g., America/Los_Angeles)'),
    attendeeEmail: z.string().describe('Email of the attendee'),
    attendeeName: z.string().optional().describe('Name of the attendee'),
    location: z.string().optional().describe('Location of the meeting'),
    createMeetingRoom: z
      .boolean()
      .optional()
      .describe('Whether to create a Google Meet link'),
  }),
  execute: async ({
    summary,
    description,
    startDateTime,
    duration,
    timeZone,
    attendeeEmail,
    attendeeName,
    location = '',
    createMeetingRoom = true,
  }) => {
    try {
      // Get the Composio connection ID for the current user
      const connectionId = await getComposioConnectionId();

      // If no connection ID found, return an error
      if (!connectionId) {
        return {
          status: 'error',
          message:
            'Google Calendar not connected. Please connect your calendar first.',
          needsAuth: true,
        };
      }

      // Calculate event duration components
      const durationHours = Math.floor(duration / 60);
      const durationMinutes = duration % 60;

      // Format start date/time for Composio
      const startDate = new Date(startDateTime);
      const formattedStart = startDate.toISOString().replace(/[.]\d+Z$/, '');

      // Use Composio to execute the action directly
      const result = await composioToolset.executeAction({
        action: 'GOOGLECALENDAR_CREATE_EVENT',
        params: {
          summary,
          description: description || '',
          start_datetime: formattedStart,
          event_duration_hour: durationHours,
          event_duration_minutes: durationMinutes,
          timezone: timeZone,
          create_meeting_room: createMeetingRoom,
          location,
          attendees: [attendeeEmail],
        },
        connectedAccountId: connectionId,
      });

      // Process the result
      if (result.successful) {
        const eventId = result.data?.id;
        const eventLink = result.data?.htmlLink;

        return {
          status: 'success',
          eventId,
          eventLink,
        };
      } else {
        return {
          status: 'error',
          message: 'Failed to create calendar event',
        };
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return {
        status: 'error',
        message: 'Failed to create calendar event',
      };
    }
  },
};

/**
 * Tool for getting the current date and time in a specific timezone
 */
export const getCurrentDateTime: ToolDefinition = {
  name: 'getCurrentDateTime',
  description: 'Get the current date and time in a specific timezone',
  schema: z.object({
    timeZone: z
      .string()
      .describe(
        'The timezone to get current date/time for (e.g., America/Los_Angeles)',
      ),
  }),
  execute: async ({ timeZone }) => {
    try {
      // Use built-in Date formatting with timezone
      const now = new Date();
      const options = {
        timeZone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      } as Intl.DateTimeFormatOptions;

      const formattedDate = now.toLocaleString('en-US', options);

      return {
        status: 'success',
        currentDateTime: formattedDate,
        timeZone,
      };
    } catch (error) {
      console.error('Error getting current date/time:', error);
      return {
        status: 'error',
        message: 'Failed to get current date and time',
      };
    }
  },
};
