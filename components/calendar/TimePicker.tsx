'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { SelectionContext } from '@/lib/calendar/types';
import { handleCalendarInteraction } from '@/lib/ai/utils/calendar-interface';
import { enhancedCalendarInteraction } from '@/lib/ai/utils/auto-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useCallback, useState, useRef, useEffect } from 'react';

// Simple Spinner component using Lucide icon
const Spinner = ({
  size = 'default',
  className = '',
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

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

// In the loading state of the TimePicker component
// Define skeleton arrays with proper keys
const MORNING_SKELETON_SLOTS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
const AFTERNOON_SKELETON_SLOTS = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];

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

  // Use refs instead of direct DOM queries
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);

  // Find form elements on mount using refs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only search for DOM elements if we're not using the chat API
    if (!chatOptions?.setInput || !chatOptions?.submit) {
      const form = document.querySelector(
        'form[data-message-form]',
      ) as HTMLFormElement;
      if (form) {
        formRef.current = form;
        inputRef.current = form.querySelector('textarea');
        submitButtonRef.current = form.querySelector('button[type="submit"]');
      }
    }
  }, [chatOptions]);

  // Create a function to handle form submission
  const submitForm = useCallback(
    (message: string) => {
      // APPROACH 1: Use chat options if available (preferred, more React-like)
      if (chatOptions?.setInput && chatOptions?.submit) {
        chatOptions.setInput(message);
        setTimeout(() => {
          chatOptions.submit?.();
        }, 10);
        return true;
      }

      // APPROACH 2: Use refs if available (more reliable than direct queries)
      if (formRef.current && inputRef.current) {
        try {
          // Set input value
          inputRef.current.value = message;

          // Trigger React's synthetic event system with modern technique
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value',
          )?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(inputRef.current, message);

            // Create and dispatch input event using modern event creation
            const inputEvent = new Event('input', {
              bubbles: true,
              cancelable: true,
              composed: true, // Ensures the event crosses shadow DOM boundaries
            });
            inputRef.current.dispatchEvent(inputEvent);

            // Submit form using the appropriate method
            if (submitButtonRef.current) {
              submitButtonRef.current.click();
            } else {
              formRef.current.requestSubmit(); // Modern submit method
            }
            return true;
          }
        } catch (err) {
          console.error('Error in React synthetic event dispatch:', err);
          setError('Failed to submit time selection. Please try again.');
        }
      }

      // Return false if we couldn't submit
      return false;
    },
    [chatOptions],
  );

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
        // Add a small delay to ensure state updates properly
        setTimeout(() => {
          console.debug('TimePicker: Submitting time selection:', timeSlot);

          // Use the enhanced calendar interaction handler for more reliable submission
          enhancedCalendarInteraction(
            'time',
            {
              date: selectedDate,
              timeSlot: timeSlot,
            },
            selectionContext,
            chatOptions, // Pass chat options for more reliable submission
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

  if (loading) {
    return (
      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl p-4 max-w-[500px] bg-[#140556] border border-[#1450ef]',
          className,
        )}
        data-component="TimePicker"
      >
        <div className="flex flex-col space-y-1">
          <Skeleton className="h-7 w-[180px] bg-[#1450ef]/30" />
          <Skeleton className="h-5 w-[250px] bg-[#1450ef]/30" />
        </div>

        <div className="space-y-6">
          <div>
            <Skeleton className="h-5 w-[100px] mb-2 bg-[#1450ef]/30" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {MORNING_SKELETON_SLOTS.map((id) => (
                <Skeleton
                  key={`morning-slot-${id}`}
                  className="h-14 w-full bg-[#1450ef]/30"
                />
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="h-5 w-[100px] mb-2 bg-[#1450ef]/30" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {AFTERNOON_SKELETON_SLOTS.map((id) => (
                <Skeleton
                  key={`afternoon-slot-${id}`}
                  className="h-14 w-full bg-[#1450ef]/30"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl p-4 max-w-[500px] bg-[#140556] border border-[#1450ef]',
        className,
      )}
      data-component="TimePicker"
    >
      <div className="flex flex-col space-y-1">
        <h2 className="text-xl font-medium text-[#f4e9dc]">Select a Time</h2>
        <p className="text-sm text-[#f4e9dc]/80">
          {selectedDate ? (
            <>
              Available times for{' '}
              {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </>
          ) : (
            <>Choose from available 30-minute slots</>
          )}
        </p>
      </div>

      {error && (
        <div className="text-red-200 text-sm py-1 px-2 bg-red-900/20 rounded border border-red-800">
          {error}
        </div>
      )}

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

      {/* Show submitting indicator */}
      {submitting && (
        <div className="flex items-center justify-center w-full py-2 text-[#f4e9dc]">
          <Spinner size="sm" className="mr-2" />
          <span>Selecting time slot...</span>
        </div>
      )}
    </div>
  );
}
