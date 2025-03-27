export interface CalendarMetadata {
  step: 'date' | 'time' | 'details' | 'confirmation';
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  selectedMeetingType: string | null;
  duration: number;
  meetingTitle: string;
  attendeeName: string;
  attendeeEmail: string;
  notes: string;
  timeZone: string;
  googleCalendarSynced: boolean;
  googleEventId: string | null;
  isAuthenticated: boolean;
  availableTimeSlots: Array<{
    startTime: string;
    endTime: string;
    meetingTypeId: string;
  }>;
}
