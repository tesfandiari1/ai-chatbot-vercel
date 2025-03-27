# Calendar Artifact Implementation Guide

This document outlines the changes made to the calendar artifact UI and explains the next steps needed to complete the implementation.

## Changes Made

1. **Component Structure**
   - Created modular components in the `components/` directory:
     - `CalendarContainer.tsx`: Main wrapper with loading state
     - `DatePicker.tsx`: Date selection component
     - `TimePicker.tsx`: Time slot selection component
     - `DetailsForm.tsx`: Meeting details form
     - `Confirmation.tsx`: Confirmation screen
     - `index.ts`: Export file for all components

2. **UI Improvements**
   - Removed black background in favor of system theme compatibility
   - Aligned visual design with other artifacts (text-editor, code-editor, etc.)
   - Added responsive design elements
   - Simplified the UI

3. **Code Quality**
   - Inlined SVG icons to avoid external dependencies
   - Fixed linting issues
   - Simplified component props and interfaces
   - Improved type safety

## Next Steps

1. **Update client.tsx**
   - The main calendar artifact file needs to be updated to use the new components

2. **Implement the client.tsx changes**:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Artifact } from '@/components/create-artifact';
import type { CalendarMetadata } from './types';
import { 
  CalendarContainer, 
  DatePicker, 
  TimePicker, 
  DetailsForm, 
  Confirmation 
} from './components';

// Authentication & API helpers
const checkGoogleCalendarAuth = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/calendar/check-auth?userId=${userId}`);
    const data = await response.json();
    return data.isAuthenticated;
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
      isAuthenticated: false,
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
    isLoading,
    metadata,
    setMetadata,
  }) => {
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
            setMetadata((currentMetadata) => ({
              ...currentMetadata,
              isAuthenticated,
            }));
          })
          .catch((error) => {
            console.error('Error checking auth:', error);
          })
          .finally(() => {
            setIsAuthChecking(false);
          });
      }
    }, [session, setMetadata]);

    // Get available time slots when date is selected
    useEffect(() => {
      if (safeMetadata.selectedDate && safeMetadata.isAuthenticated) {
        // Here we would call a function to fetch available time slots
        // For now, let's simulate with dummy data
        setTimeout(() => {
          setMetadata((currentMetadata) => ({
            ...currentMetadata,
            availableTimeSlots: [
              { startTime: '5:00pm', endTime: '5:30pm', meetingTypeId: '30min' },
              { startTime: '5:30pm', endTime: '6:00pm', meetingTypeId: '30min' },
              { startTime: '6:00pm', endTime: '7:00pm', meetingTypeId: '60min' },
              { startTime: '7:00pm', endTime: '8:00pm', meetingTypeId: '60min' },
            ],
          }));
        }, 1000);
      }
    }, [safeMetadata.selectedDate, safeMetadata.isAuthenticated, setMetadata]);

    // Handle navigation between steps
    const handleNextStep = () => {
      const currentStep = safeMetadata.step;

      if (currentStep === 'date' && safeMetadata.selectedDate) {
        setMetadata((currentMetadata) => ({ ...currentMetadata, step: 'time' }));
      } else if (currentStep === 'time' && safeMetadata.selectedTimeSlot) {
        setMetadata((currentMetadata) => ({ ...currentMetadata, step: 'details' }));
      } else if (currentStep === 'details' && validateDetails()) {
        setMetadata((currentMetadata) => ({ ...currentMetadata, step: 'confirmation' }));
      }
    };

    const handlePrevStep = () => {
      const currentStep = safeMetadata.step;

      if (currentStep === 'time') {
        setMetadata((currentMetadata) => ({ ...currentMetadata, step: 'date' }));
      } else if (currentStep === 'details') {
        setMetadata((currentMetadata) => ({ ...currentMetadata, step: 'time' }));
      } else if (currentStep === 'confirmation') {
        setMetadata((currentMetadata) => ({ ...currentMetadata, step: 'details' }));
      }
    };

    const validateDetails = () => {
      return (
        safeMetadata.attendeeName &&
        safeMetadata.attendeeEmail &&
        safeMetadata.meetingTitle
      );
    };

    const handleAuthWithGoogleCalendar = () => {
      // Store current URL to redirect back after authentication
      const callbackUrl = window.location.href;
      // Redirect to Google Calendar OAuth flow
      window.location.href = `/api/auth/google-calendar?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    };

    return (
      <CalendarContainer isLoading={isLoading || isAuthChecking}>
        {!isAuthChecking && !safeMetadata.isAuthenticated ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <svg
              className="h-12 w-12 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <h3 className="text-lg font-medium">Connect to Google Calendar</h3>
            <p className="text-center text-sm text-muted-foreground">
              To schedule meetings, you need to connect your Google Calendar account.
            </p>
            <Button onClick={handleAuthWithGoogleCalendar}>
              Connect Google Calendar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {safeMetadata.step === 'date' && (
              <DatePicker 
                selectedDate={safeMetadata.selectedDate}
                onDateSelect={(date) => 
                  setMetadata((currentMetadata) => ({
                    ...currentMetadata,
                    selectedDate: date,
                  }))
                }
              />
            )}
            
            {safeMetadata.step === 'time' && (
              <TimePicker 
                availableTimeSlots={safeMetadata.availableTimeSlots}
                selectedTimeSlot={safeMetadata.selectedTimeSlot}
                onTimeSlotSelect={(timeSlot, meetingType, duration) => 
                  setMetadata((currentMetadata) => ({
                    ...currentMetadata,
                    selectedTimeSlot: timeSlot,
                    selectedMeetingType: meetingType,
                    duration,
                  }))
                }
              />
            )}
            
            {safeMetadata.step === 'details' && (
              <DetailsForm 
                metadata={safeMetadata}
                onChange={(field, value) => 
                  setMetadata((currentMetadata) => ({
                    ...currentMetadata,
                    [field]: value,
                  }))
                }
              />
            )}
            
            {safeMetadata.step === 'confirmation' && (
              <Confirmation metadata={safeMetadata} />
            )}

            {safeMetadata.step !== 'confirmation' && (
              <div className="flex justify-between mt-4 pt-4 border-t">
                {safeMetadata.step !== 'date' ? (
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                  >
                    Back
                  </Button>
                ) : <div />}
                
                <Button
                  onClick={handleNextStep}
                  disabled={
                    (safeMetadata.step === 'date' && !safeMetadata.selectedDate) ||
                    (safeMetadata.step === 'time' && !safeMetadata.selectedTimeSlot) ||
                    (safeMetadata.step === 'details' && !validateDetails())
                  }
                >
                  {safeMetadata.step === 'details' ? 'Confirm' : 'Continue'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CalendarContainer>
    );
  },
  actions: [
    {
      icon: <span>🔄</span>,
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
  toolbar: [],
});
```

3. **Test the Implementation**
   - Verify the UI matches the application's design language
   - Test in both light and dark modes
   - Ensure all steps work as expected
   - Verify integration with Google Calendar if implemented

4. **Potential Improvements**
   - Add animation for transitions between steps
   - Implement actual API calls for calendar availability
   - Add more comprehensive error handling
   - Implement accessibility features

## Notes on Remaining Issues

- If the Tabs component is needed, ensure it's properly imported from your UI library
- Fix any remaining linter errors, especially with index keys in mapped arrays
- Update types.ts if needed to match the new component structure
- Consider adding more actions in the toolbar for calendar-specific operations 