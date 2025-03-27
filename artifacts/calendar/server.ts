import { z } from 'zod';
import { createDocumentHandler } from '@/lib/artifacts/server';
import type { CalendarMetadata } from './types';
import {
  checkCalendarAvailability,
  createCalendarEvent,
  getCurrentDateTime,
} from '@/lib/tools/google-calendar';

// Define the schema for validation
const calendarMetadataSchema = z.object({
  step: z.enum(['date', 'time', 'details', 'confirmation']),
  selectedDate: z.string().nullable(),
  selectedTimeSlot: z.string().nullable(),
  selectedMeetingType: z.string().nullable(),
  duration: z.number().optional().default(30),
  meetingTitle: z.string().default(''),
  attendeeName: z.string().default(''),
  attendeeEmail: z.string().default(''),
  notes: z.string().default(''),
  timeZone: z.string().default('America/Los_Angeles'),
  googleCalendarSynced: z.boolean().default(false),
  googleEventId: z.string().nullable(),
  availableTimeSlots: z
    .array(
      z.object({
        startTime: z.string(),
        endTime: z.string(),
        meetingTypeId: z.string(),
      }),
    )
    .default([]),
});

// Helper functions for the calendar artifact
async function getAvailability(date: string, timeZone: string, duration = 30) {
  try {
    // Use the Composio tool for checking calendar availability
    const result = await checkCalendarAvailability.execute({
      date,
      timeZone,
      duration,
    });

    if (result.status === 'success' && result.availableSlots) {
      return result.availableSlots;
    }

    // If there's an error or no slots, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching availability:', error);
    return [];
  }
}

async function scheduleMeeting(metadata: CalendarMetadata) {
  try {
    if (
      !metadata.selectedDate ||
      !metadata.selectedTimeSlot ||
      !metadata.attendeeEmail
    ) {
      throw new Error('Missing required fields for scheduling');
    }

    // Parse the selected date and time
    const dateObj = new Date(metadata.selectedDate);
    const [timeString, ampm] = (metadata.selectedTimeSlot || '').split(' ');
    const [hourStr, minuteStr] = timeString.split(':');

    let hour = Number.parseInt(hourStr, 10);
    const minute = Number.parseInt(minuteStr, 10) || 0;

    // Convert to 24-hour format if PM
    if (ampm?.toLowerCase() === 'pm' && hour < 12) {
      hour += 12;
    } else if (ampm?.toLowerCase() === 'am' && hour === 12) {
      hour = 0;
    }

    // Set the correct time
    dateObj.setHours(hour, minute, 0, 0);

    // Use the Composio tool to create the calendar event
    const result = await createCalendarEvent.execute({
      summary: metadata.meetingTitle || 'Meeting',
      description: metadata.notes,
      startDateTime: dateObj.toISOString(),
      duration: metadata.duration,
      timeZone: metadata.timeZone,
      attendeeEmail: metadata.attendeeEmail,
      attendeeName: metadata.attendeeName,
      createMeetingRoom: true,
    });

    if (result.status === 'success') {
      return {
        success: true,
        googleEventId: result.eventId,
        googleEventLink: result.eventLink,
      };
    } else {
      throw new Error(result.message || 'Failed to create calendar event');
    }
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to schedule meeting',
    };
  }
}

// Export the calendarArtifact definition following the createDocumentHandler pattern
export const calendarDocumentHandler = createDocumentHandler<'calendar'>({
  kind: 'calendar',
  // Called when the document is first created
  onCreateDocument: async ({ title, dataStream }) => {
    const draftContent = '';

    // Stream some initial info
    dataStream.writeData({
      type: 'info-update',
      content: 'Initializing calendar scheduling...',
    });

    // Return empty content since we use metadata for state
    return draftContent;
  },
  // Called when updating the document based on user modifications
  onUpdateDocument: async ({ document, description, dataStream }) => {
    const draftContent = document.content || '';

    // Stream update info
    dataStream.writeData({
      type: 'info-update',
      content: 'Updating calendar scheduling...',
    });

    // Return the content (calendar uses metadata, not content)
    return draftContent;
  },
});

// Export the calendarArtifact for use in other parts of the code
export const calendarArtifact = {
  name: 'calendar',
  displayName: 'Calendar Scheduling',
  description: 'Schedule a meeting on a selected date and time',

  defaultMetadata: {
    step: 'date',
    selectedDate: null,
    selectedTimeSlot: null,
    selectedMeetingType: null,
    duration: 30,
    meetingTitle: '',
    attendeeName: '',
    attendeeEmail: '',
    notes: '',
    timeZone: 'America/Los_Angeles',
    googleCalendarSynced: false,
    googleEventId: null,
    availableTimeSlots: [],
  },

  validateMetadata: (metadata: any) => {
    return calendarMetadataSchema.parse(metadata);
  },

  // Expose helper functions
  getAvailability,
  scheduleMeeting,
};
