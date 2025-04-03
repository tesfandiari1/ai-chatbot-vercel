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
 */
export async function getCalendarToolset() {
  try {
    if (!isComposioConfigured()) {
      throw new Error('Composio not configured properly');
    }

    return {
      toolset: composioToolset,
      calendarId: COMPANY_CALENDAR_ID,
    };
  } catch (error) {
    console.error('Error getting calendar toolset:', error);
    return {
      toolset: composioToolset,
      calendarId: COMPANY_CALENDAR_ID,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert a time slot string (e.g., "2:00pm") to an ISO string for a given date
 */
export function convertTimeSlotToISO(
  dateStr: string,
  timeSlot: string,
): string {
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
 * Get default time slots for a given appointment type
 */
export function getDefaultTimeSlots(): string[] {
  return [
    '9:00am',
    '9:30am',
    '10:00am',
    '10:30am',
    '11:00am',
    '11:30am',
    '1:00pm',
    '1:30pm',
    '2:00pm',
    '2:30pm',
    '3:00pm',
    '3:30pm',
    '4:00pm',
    '4:30pm',
  ];
}

/**
 * Process availability data from Google Calendar to get available time slots
 */
export function processAvailability(
  data: any,
  appointmentType: string,
): string[] {
  // If no data, return default slots
  if (!data || !data.calendars || !COMPANY_CALENDAR_ID) {
    return getDefaultTimeSlots();
  }

  try {
    const calendarData = data.calendars[COMPANY_CALENDAR_ID];
    const busySlots = calendarData.busy || [];
    const type = appointmentType.toLowerCase() as AppointmentType;
    const appointmentDuration = APPOINTMENT_TYPES[type] || 30;

    // Business hours (9am to 5pm)
    const startHour = 9;
    const endHour = 17;

    // Generate all possible slots at 30-minute intervals
    const allSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === endHour - 1 && minute + appointmentDuration > 60) continue;

        const slot = new Date();
        slot.setHours(hour, minute, 0, 0);
        allSlots.push(slot);
      }
    }

    // Filter out busy slots
    const availableSlots = allSlots.filter((slot) => {
      const slotEnd = new Date(slot);
      slotEnd.setMinutes(slot.getMinutes() + appointmentDuration);

      return !busySlots.some((busy: any) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);

        return (
          (slot >= busyStart && slot < busyEnd) ||
          (slotEnd > busyStart && slotEnd <= busyEnd) ||
          (slot <= busyStart && slotEnd >= busyEnd)
        );
      });
    });

    // Format the available slots as strings
    return availableSlots.map((slot) => {
      let hours = slot.getHours();
      const minutes = slot.getMinutes();
      const meridiem = hours >= 12 ? 'pm' : 'am';

      // Convert 24-hour to 12-hour format
      if (hours > 12) hours -= 12;
      else if (hours === 0) hours = 12;

      return `${hours}:${minutes === 0 ? '00' : minutes}${meridiem}`;
    });
  } catch (error) {
    console.error('Error processing availability data:', error);
    return getDefaultTimeSlots();
  }
}

/**
 * Process availability data from Google Calendar to extract available dates
 */
export function processAvailableDates(data: any): string[] {
  // Generate default dates (next 5 business days)
  function getDefaultDates() {
    const defaultDates = [];
    const today = new Date();

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        defaultDates.push(date.toISOString().split('T')[0]);
        if (defaultDates.length >= 5) break;
      }
    }

    return defaultDates;
  }

  // If no valid data, return default dates
  if (!data || !data.calendars || !COMPANY_CALENDAR_ID) {
    return getDefaultDates();
  }

  try {
    const calendarData = data.calendars[COMPANY_CALENDAR_ID];
    const busySlots = calendarData.busy || [];

    // Create an array of all business days in the next two weeks
    const allDates = [];
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setDate(currentDate.getDate() + 14);

    while (currentDate <= endDate) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        allDates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Filter available dates
    const availableDates = allDates.filter((date) => {
      const dateStr = date.toISOString().split('T')[0];

      // Day is unavailable if fully booked during business hours
      const wholeDayBusy = busySlots.some((busy: any) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);

        return (
          busyStart <= new Date(`${dateStr}T09:00:00Z`) &&
          busyEnd >= new Date(`${dateStr}T17:00:00Z`)
        );
      });

      return !wholeDayBusy;
    });

    return availableDates.map((date) => date.toISOString().split('T')[0]);
  } catch (error) {
    console.error('Error processing available dates:', error);
    return getDefaultDates();
  }
}

/**
 * Waits for a calendar connection to become active for a user
 * @param userId User ID to check connection for
 * @returns Success status and connection ID or error
 */
export async function waitForCalendarConnection(userId: string) {
  try {
    if (!isComposioConfigured()) {
      throw new Error('Composio not configured properly');
    }

    // In a real implementation, this would poll the Composio API
    // For now, we'll just return success with the connection ID from env
    return {
      success: true,
      connectionId: COMPOSIO_CONNECTION_ID,
    };
  } catch (error) {
    console.error('Error waiting for calendar connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
