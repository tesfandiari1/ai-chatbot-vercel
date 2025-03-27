'use client';

import { useState, useEffect } from 'react';
import { Artifact } from '@/components/create-artifact';
import { useSession } from 'next-auth/react';
import type { CalendarMetadata } from './types';

// Import components from the components directory
import {
  CalendarContainer,
  DatePicker,
  TimePicker,
  DetailsForm,
  Confirmation,
} from './components';

// Import UI components
import { Button } from '@/components/ui/button';
import { RefreshCcwIcon, CalendarIcon } from 'lucide-react';

// Authentication helper
const checkGoogleCalendarAuth = async (userId: string): Promise<boolean> => {
  try {
    // TEMPORARY MOCK: Return true to bypass authentication issues
    console.log('Using mock Google Calendar authentication');
    return true;

    /* ORIGINAL CODE - Uncomment when database is fixed
    const response = await fetch(`/api/calendar/check-auth?userId=${userId}`);
    const data = await response.json();
    return data.isAuthenticated;
    */
  } catch (error) {
    console.error('Error checking Google Calendar auth:', error);
    return false;
  }
};

export const calendarArtifact = new Artifact<'calendar', CalendarMetadata>({
  kind: 'calendar',
  description: 'Schedule a meeting on a selected date and time',
  initialize: async ({ documentId, setMetadata }) => {
    // Initialize with default metadata
    setMetadata({
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
      isAuthenticated: false, // Add authentication state
    });
  },
  onStreamPart: ({ streamPart, setMetadata }) => {
    if (streamPart.type === 'text-delta') {
      // Handle any stream updates if needed
    }
  },
  content: ({
    title,
    content,
    mode,
    status,
    currentVersionIndex,
    suggestions,
    onSaveContent,
    isInline,
    isCurrentVersion,
    getDocumentContentById,
    isLoading,
    metadata,
    setMetadata,
  }) => {
    if (isLoading) {
      return (
        <CalendarContainer isLoading={true}>
          <div />
        </CalendarContainer>
      );
    }

    return (
      <div className="relative">
        <CalendarArtifact
          metadata={metadata}
          updateMetadata={(updatedMetadata) => {
            if (typeof updatedMetadata === 'function') {
              setMetadata(updatedMetadata);
            } else {
              setMetadata((currentMetadata) => ({
                ...currentMetadata,
                ...updatedMetadata,
              }));
            }
          }}
          submitArtifact={() => {
            // Save any changes to content if needed
            if (onSaveContent && content) {
              onSaveContent(content, false);
            }
          }}
        />
      </div>
    );
  },
  actions: [
    {
      icon: <RefreshCcwIcon className="h-4 w-4" />,
      description: 'Reset calendar',
      onClick: ({ setMetadata }) => {
        setMetadata({
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
          isAuthenticated: false,
        });
      },
    },
  ],
  toolbar: [], // Add empty toolbar to satisfy the type requirement
});

interface CalendarArtifactProps {
  metadata: CalendarMetadata;
  updateMetadata: (metadata: Partial<CalendarMetadata>) => void;
  submitArtifact: () => void;
}

export function CalendarArtifact({
  metadata,
  updateMetadata,
  submitArtifact,
}: CalendarArtifactProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const { data: session } = useSession();

  // Create default metadata to handle null case
  const safeMetadata: CalendarMetadata = metadata || {
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
    isAuthenticated: false,
  };

  // Check for Google Calendar authentication
  useEffect(() => {
    if (session?.user?.id) {
      setIsAuthChecking(true);
      checkGoogleCalendarAuth(session.user.id)
        .then((isAuthenticated) => {
          updateMetadata({ isAuthenticated });
        })
        .catch((error) => {
          console.error('Error checking auth:', error);
        })
        .finally(() => {
          setIsAuthChecking(false);
        });
    }
  }, [session, updateMetadata]);

  // Get available time slots when date is selected
  useEffect(() => {
    if (safeMetadata.selectedDate && safeMetadata.isAuthenticated) {
      setIsLoading(true);
      // Here we would call a function to fetch available time slots
      // For now, let's simulate with dummy data
      setTimeout(() => {
        updateMetadata({
          availableTimeSlots: [
            { startTime: '5:00pm', endTime: '5:30pm', meetingTypeId: '30min' },
            { startTime: '5:30pm', endTime: '6:00pm', meetingTypeId: '30min' },
            { startTime: '6:00pm', endTime: '7:00pm', meetingTypeId: '60min' },
            { startTime: '7:00pm', endTime: '8:00pm', meetingTypeId: '60min' },
          ],
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [safeMetadata.selectedDate, safeMetadata.isAuthenticated, updateMetadata]);

  // Handle authentication with Google Calendar
  const handleAuthWithGoogleCalendar = () => {
    // Store current URL to redirect back after authentication
    const callbackUrl = window.location.href;
    // Redirect to Google Calendar OAuth flow
    window.location.href = `/api/auth/google-calendar?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  // Render authentication prompt if not authenticated
  if (!isAuthChecking && !safeMetadata.isAuthenticated) {
    return (
      <CalendarContainer>
        <div className="p-4 flex flex-col items-center justify-center space-y-4">
          <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-medium">Connect to Google Calendar</h3>
          <p className="text-center text-sm text-muted-foreground">
            To schedule meetings, you need to connect your Google Calendar
            account.
          </p>
          <Button onClick={handleAuthWithGoogleCalendar}>
            Connect Google Calendar
          </Button>
        </div>
      </CalendarContainer>
    );
  }

  const handleNextStep = () => {
    const currentStep = safeMetadata.step;

    if (currentStep === 'date' && safeMetadata.selectedDate) {
      updateMetadata({ step: 'time' });
    } else if (currentStep === 'time' && safeMetadata.selectedTimeSlot) {
      updateMetadata({ step: 'details' });
    } else if (currentStep === 'details' && validateDetails()) {
      updateMetadata({ step: 'confirmation' });
    } else if (currentStep === 'confirmation') {
      // Here we would call the Google Calendar tool via Composio
      submitArtifact();
    }
  };

  const handlePrevStep = () => {
    const currentStep = safeMetadata.step;

    if (currentStep === 'time') {
      updateMetadata({ step: 'date' });
    } else if (currentStep === 'details') {
      updateMetadata({ step: 'time' });
    } else if (currentStep === 'confirmation') {
      updateMetadata({ step: 'details' });
    }
  };

  const validateDetails = () => {
    return (
      safeMetadata.attendeeName &&
      safeMetadata.attendeeEmail &&
      safeMetadata.meetingTitle
    );
  };

  // Handle field changes in the details form
  const handleFieldChange = (field: string, value: string) => {
    updateMetadata({ [field]: value } as Partial<CalendarMetadata>);
  };

  return (
    <CalendarContainer isLoading={isLoading}>
      <div className="space-y-3">
        {safeMetadata.step === 'date' && (
          <DatePicker
            selectedDate={safeMetadata.selectedDate}
            onDateSelect={(date) => updateMetadata({ selectedDate: date })}
          />
        )}

        {safeMetadata.step === 'time' && (
          <TimePicker
            selectedTimeSlot={safeMetadata.selectedTimeSlot}
            availableTimeSlots={safeMetadata.availableTimeSlots}
            onTimeSlotSelect={(timeSlot, meetingType, duration) =>
              updateMetadata({
                selectedTimeSlot: timeSlot,
                selectedMeetingType: meetingType,
                duration,
              })
            }
          />
        )}

        {safeMetadata.step === 'details' && (
          <DetailsForm metadata={safeMetadata} onChange={handleFieldChange} />
        )}

        {safeMetadata.step === 'confirmation' && (
          <Confirmation metadata={safeMetadata} />
        )}

        {safeMetadata.step !== 'confirmation' && (
          <div className="flex justify-between mt-4">
            {safeMetadata.step !== 'date' ? (
              <Button variant="ghost" onClick={handlePrevStep}>
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleNextStep}
              disabled={
                (safeMetadata.step === 'date' && !safeMetadata.selectedDate) ||
                (safeMetadata.step === 'time' &&
                  !safeMetadata.selectedTimeSlot) ||
                (safeMetadata.step === 'details' && !validateDetails()) ||
                isLoading
              }
            >
              {safeMetadata.step === 'details' ? 'Confirm' : 'Continue'}
            </Button>
          </div>
        )}
      </div>
    </CalendarContainer>
  );
}
