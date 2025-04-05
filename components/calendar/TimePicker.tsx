'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { SelectionContext } from '@/lib/calendar/types';
import { handleCalendarInteraction } from '@/lib/calendar/utils';
import { useCallback, useState, useRef } from 'react';
import {
  CalendarContainer,
  TimeSlotsLoader,
  SubmittingIndicator,
  getChatFunctions,
} from './ui-components';

interface TimePickerProps {
  selectedDate: string;
  selectedTimeSlot: string | null;
  bookedSlots: string[];
  onTimeSlotSelect: (timeSlot: string, context?: SelectionContext) => void;
  applicationContext?: any; // Optional context from previous steps
  autoAdvance?: boolean; // Whether to automatically advance to the next step
  className?: string;
  loading?: boolean; // Add loading prop
  chatOptions?: {
    setInput?: (text: string) => void;
    submit?: () => void;
  };
}

// Fixed time slots - these don't need to be recalculated each render
const MORNING_SLOTS = [
  '9:00am',
  '9:30am',
  '10:00am',
  '10:30am',
  '11:00am',
  '11:30am',
];

const AFTERNOON_SLOTS = [
  '1:00pm',
  '1:30pm',
  '2:00pm',
  '2:30pm',
  '3:00pm',
  '3:30pm',
  '4:00pm',
  '4:30pm',
];

export function TimePicker({
  selectedDate,
  selectedTimeSlot,
  bookedSlots = [],
  onTimeSlotSelect,
  applicationContext,
  autoAdvance = false,
  className,
  loading = false, // Default to false
  chatOptions,
}: TimePickerProps) {
  // Add state to track the currently selected time
  const [localSelectedTimeSlot, setLocalSelectedTimeSlot] = useState<
    string | null
  >(selectedTimeSlot);

  // Add submitting state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add ref to prevent multiple submissions
  const timeSelectSubmittedRef = useRef(false);

  // Memoize the select handler to avoid recreation on each render
  const handleTimeSelect = useCallback(
    (timeSlot: string) => {
      // Prevent multiple submissions
      if (timeSelectSubmittedRef.current) return;

      // Update local state
      setLocalSelectedTimeSlot(timeSlot);
      setError(null);
      setSubmitting(true);

      // Set the flag to prevent multiple submissions
      timeSelectSubmittedRef.current = true;

      // Create selection context with forced auto-advance
      const selectionContext: SelectionContext = {
        autoAdvance: true, // Always force autoAdvance to true
        previousSelections: applicationContext,
      };

      // Call with the selection context for context-aware handling
      onTimeSlotSelect(timeSlot, selectionContext);

      try {
        // Use the chat functions from ui-components
        const chatFunctions = chatOptions || getChatFunctions();

        // Add a small delay to ensure state updates properly
        setTimeout(() => {
          console.debug('TimePicker: Submitting time selection:', timeSlot);

          // Use the unified calendar interaction handler
          handleCalendarInteraction(
            'time',
            {
              date: selectedDate,
              timeSlot: timeSlot,
            },
            selectionContext,
            {
              setInput: chatFunctions.setInput,
              submit: chatFunctions.submit,
            },
          );

          // Clear submitting state after a delay
          setTimeout(() => {
            setSubmitting(false);
            // Reset the submission flag to allow future selections
            timeSelectSubmittedRef.current = false;
          }, 1500);
        }, 100);
      } catch (err) {
        console.error('Error during time selection:', err);
        setError('Failed to select time. Please try again.');
        setSubmitting(false);
        timeSelectSubmittedRef.current = false;
      }
    },
    [selectedDate, onTimeSlotSelect, applicationContext, chatOptions],
  );

  // Create TimeSlotGroup component for reuse
  const TimeSlotGroup = ({
    title,
    slots,
  }: { title: string; slots: string[] }) => (
    <div>
      <h3 className="text-sm font-medium mb-2 text-[#f4e9dc]">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-2">
        {slots.map((timeSlot) => (
          <Button
            key={timeSlot}
            variant={localSelectedTimeSlot === timeSlot ? 'default' : 'outline'}
            onClick={() => handleTimeSelect(timeSlot)}
            className={cn(
              'w-full justify-center py-6',
              localSelectedTimeSlot === timeSlot
                ? 'bg-[#1450ef] hover:bg-[#1450ef]/90 text-[#f4e9dc]'
                : 'border-[#1450ef]/30 text-[#f4e9dc] hover:bg-[#1450ef]/20',
            )}
            disabled={bookedSlots.includes(timeSlot) || loading}
          >
            {timeSlot}
          </Button>
        ))}
      </div>
    </div>
  );

  // If loading, use the TimeSlotsLoader component
  if (loading) {
    return (
      <CalendarContainer
        title="Select a Time"
        subtitle="Loading available time slots..."
        className={className}
        dataComponent="TimePicker"
        loading={true}
      >
        <TimeSlotsLoader />
      </CalendarContainer>
    );
  }

  // Format date for subtitle
  const subtitle = selectedDate
    ? `Available times for ${format(new Date(selectedDate), 'MMMM d, yyyy')}`
    : `Choose from available 30-minute slots`;

  return (
    <CalendarContainer
      title="Select a Time"
      subtitle={subtitle}
      className={className}
      dataComponent="TimePicker"
      error={error}
    >
      <div className="space-y-6">
        {MORNING_SLOTS.length > 0 && (
          <TimeSlotGroup title="Morning" slots={MORNING_SLOTS} />
        )}

        {AFTERNOON_SLOTS.length > 0 && (
          <TimeSlotGroup title="Afternoon" slots={AFTERNOON_SLOTS} />
        )}

        {MORNING_SLOTS.length === 0 && AFTERNOON_SLOTS.length === 0 && (
          <div className="text-center p-4 text-[#f4e9dc]/80">
            No time slots available for this date.
          </div>
        )}
      </div>

      <SubmittingIndicator
        text="Selecting time slot..."
        submitting={submitting}
      />
    </CalendarContainer>
  );
}
