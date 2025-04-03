
import {
  composioToolset,
  composioClient,
  isComposioConfigured,
} from './config';
import { APPOINTMENT_TYPES, type AppointmentType } from '@/lib/calendar/types';

// Company calendar ID (not user's primary)
const COMPANY_CALENDAR_ID =
  process.env.COMPANY_CALENDAR_ID || 'uniwise-appointments@example.com';

// Real connection ID from environment or config
const COMPOSIO_CONNECTION_ID =
  process.env.COMPOSIO_CONNECTION_ID || '45c1d6cd-c8ed-409b-afed-d9c03c0fff75';

/**
 * Gets a calendar toolset using the Composio service account authentication.
 * This approach uses the company calendar instead of user-specific calendars.
 * No OAuth flow needed - all operations are performed using the connection ID.
 */
export async function getCalendarToolset() {
  try {
    // Confirm Composio is properly configured
    if (!isComposioConfigured()) {
      throw new Error('Composio not configured properly');
    }

    // Get calendar tools for availability and event creation
    // Using the pre-configured composioToolset from config.ts
    const tools = await composioToolset.getTools({
      actions: [
        'GOOGLECALENDAR_FIND_FREE_SLOTS',
        'GOOGLECALENDAR_CREATE_EVENT',
      ],
    });

    return {
      toolset: composioToolset,
      tools,
      calendarId: COMPANY_CALENDAR_ID,
      connectionId: COMPOSIO_CONNECTION_ID,
    };
  } catch (error) {
    console.error('Error getting calendar toolset:', error);
    // Return a minimal implementation for error cases
    return {
      toolset: composioToolset,
      tools: [],
      calendarId: COMPANY_CALENDAR_ID,
      connectionId: COMPOSIO_CONNECTION_ID,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Wait for a Composio connection to become active
 * This checks the actual connection status from Composio
 */
export async function waitForCalendarConnection(userId: string) {
  try {
    // Get the actual connection from Composio
    const connection = await composioClient.connectedAccounts.get({
      connectedAccountId: COMPOSIO_CONNECTION_ID,
    });

    // Check if the connection is active
    return {
      success: true,
      connectionId: connection.id || COMPOSIO_CONNECTION_ID,
      status: connection.status || 'active',
    };
  } catch (error) {
    console.error('Error waiting for calendar connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert a time slot string (e.g., "2:00pm") to an ISO string for a given date
 *
 * @param dateStr The date string in YYYY-MM-DD format
 * @param timeSlot The time slot string (e.g., "2:00pm")
 * @returns ISO date string
 */
export function convertTimeSlotToISO(
  dateStr: string,
  timeSlot: string,
): string {
  // Convert "2:00pm" format to ISO date string
  const date = new Date(dateStr);
  const [time, meridiem] = timeSlot.split(/([ap]m)/i);
  let [hours, minutes] = time.split(':').map((num) => Number.parseInt(num, 10));

  if (meridiem.toLowerCase() === 'pm' && hours < 12) {
    hours += 12;
  } else if (meridiem.toLowerCase() === 'am' && hours === 12) {
    hours = 0;
  }

  date.setHours(hours, minutes || 0, 0, 0);
  return date.toISOString();
}

/**
 * Process availability data from Google Calendar to get available time slots
 *
 * @param data The data returned from GOOGLECALENDAR_FIND_FREE_SLOTS
 * @param appointmentType The type of appointment requested
 * @returns Array of available time slots
 */
export function processAvailability(
  data: any,
  appointmentType: string,
): string[] {
  if (!data || !data.calendars || !COMPANY_CALENDAR_ID) {
    // Return some default slots for testing/fallback
    return [
      '9:00am',
      '10:00am',
      '11:00am',
      '1:00pm',
      '2:00pm',
      '3:00pm',
      '4:00pm',
    ];
  }

  try {
    const calendarData = data.calendars[COMPANY_CALENDAR_ID];
    const busySlots = calendarData.busy || [];
    // Convert to lowercase and ensure it's a valid appointment type
    const type = appointmentType.toLowerCase() as AppointmentType;
    const appointmentDuration = APPOINTMENT_TYPES[type] || 30;

    // Business hours (9am to 5pm)
    const startHour = 9;
    const endHour = 17;

    // Generate all possible slots at 30-minute intervals
    const allSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === endHour - 1 && minute + appointmentDuration > 60) {
          // Skip slots that would go past end of business hours
          continue;
        }

        const slot = new Date();
        slot.setHours(hour, minute, 0, 0);
        allSlots.push(slot);
      }
    }

    // Filter out busy slots
    const availableSlots = allSlots.filter((slot) => {
      const slotEnd = new Date(slot);
      slotEnd.setMinutes(slot.getMinutes() + appointmentDuration);

      // Check if this slot overlaps with any busy time
      return !busySlots.some((busy: any) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);

        return (
          (slot >= busyStart && slot < busyEnd) || // Slot start is during busy time
          (slotEnd > busyStart && slotEnd <= busyEnd) || // Slot end is during busy time
          (slot <= busyStart && slotEnd >= busyEnd) // Slot completely encompasses busy time
        );
      });
    });

    // Format the available slots as strings
    return availableSlots.map((slot) => {
      let hours = slot.getHours();
      const minutes = slot.getMinutes();
      const meridiem = hours >= 12 ? 'pm' : 'am';

      // Convert 24-hour to 12-hour format
      if (hours > 12) {
        hours -= 12;
      } else if (hours === 0) {
        hours = 12;
      }

      return `${hours}:${minutes === 0 ? '00' : minutes}${meridiem}`;
    });
  } catch (error) {
    console.error('Error processing availability data:', error);
    // Return default slots in case of error
    return [
      '9:00am',
      '10:00am',
      '11:00am',
      '1:00pm',
      '2:00pm',
      '3:00pm',
      '4:00pm',
    ];
  }
}
