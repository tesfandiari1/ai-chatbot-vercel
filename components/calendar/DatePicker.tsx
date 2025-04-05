'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type {
  SelectionContext,
  AppointmentType,
  CalendarContext,
} from '@/lib/calendar/types';
import { Button } from '@/components/ui/button';
import { handleCalendarInteraction } from '@/lib/calendar/utils';
import { useState, useCallback, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  useCalendarContext,
  useCalendarActions,
  createSelectionContext,
} from '@/lib/calendar/context';
import {
  CalendarSpinner,
  CalendarContainer,
  CalendarLoader,
  SubmittingIndicator,
  getChatFunctions,
} from './ui-components';

interface DatePickerProps {
  selectedDate?: string;
  onDateSelect?: (date: string, context?: SelectionContext) => void;
  applicationContext?: CalendarContext;
  autoAdvance?: boolean;
  className?: string;
  availableDates?: string[];
  appointmentType?: AppointmentType;
  loading?: boolean;
  chatOptions?: {
    setInput?: (text: string) => void;
    submit?: () => void;
  };
}

export function DatePicker({
  selectedDate: propSelectedDate,
  onDateSelect,
  applicationContext,
  autoAdvance = false,
  className,
  availableDates = [],
  appointmentType: propAppointmentType = 'consultation',
  loading = false,
  chatOptions,
}: DatePickerProps) {
  // Use our context for state management
  const { state } = useCalendarContext();
  const { setDate, setStep, setAppointmentType, setAutoAdvance } =
    useCalendarActions();

  // Use context values if available, fallback to props
  const effectiveSelectedDate = state.selectedDate || propSelectedDate;
  const effectiveAppointmentType = state.appointmentType || propAppointmentType;

  // Use a ref to track initial render to avoid loops
  const initializedRef = React.useRef(false);
  const dateSelectSubmittedRef = React.useRef(false);

  // Set auto-advance from props if provided (once on mount)
  React.useEffect(() => {
    // Only run this on the first render
    if (!initializedRef.current) {
      initializedRef.current = true;

      if (autoAdvance !== undefined) {
        setAutoAdvance(autoAdvance);
      }

      // Set appointment type if provided and different
      if (
        propAppointmentType &&
        propAppointmentType !== state.appointmentType
      ) {
        setAppointmentType(propAppointmentType);
      }
    }
  }, [
    autoAdvance,
    propAppointmentType,
    setAutoAdvance,
    setAppointmentType,
    state.appointmentType,
  ]);

  const [date, setLocalDate] = React.useState<Date | undefined>(
    effectiveSelectedDate ? new Date(effectiveSelectedDate) : undefined,
  );
  const [submitting, setSubmitting] = useState(false);

  const handleDateSubmit = useCallback(() => {
    if (!date || dateSelectSubmittedRef.current) return;

    // Set flag to prevent multiple submissions
    dateSelectSubmittedRef.current = true;

    // Set submitting state
    setSubmitting(true);

    // Format date as ISO string and extract date portion
    const formattedDate = date.toISOString().split('T')[0];

    // Update global context
    setDate(formattedDate);
    setStep('time');

    // Create the selection context from our state
    const selectionContext = createSelectionContext({
      ...state,
      currentStep: 'date',
      selectedDate: formattedDate,
      appointmentType: effectiveAppointmentType,
    });

    try {
      console.debug('DatePicker: Submitting date selection:', formattedDate);

      // Call the handler to advance to next step with proper options
      const fullContext = {
        ...selectionContext,
        autoAdvance: true, // Always force auto advance
      };

      // Use the chat functions from ui-components
      const chatFunctions = chatOptions || getChatFunctions();

      // Add a small delay to ensure state updates complete before submission
      setTimeout(() => {
        handleCalendarInteraction('date', formattedDate, fullContext, {
          setInput: chatFunctions.setInput,
          submit: chatFunctions.submit,
        });

        // Also call onDateSelect if provided
        if (onDateSelect) {
          onDateSelect(formattedDate, fullContext);
        }

        // Clear submitting state after a delay
        setTimeout(() => {
          if (submitting) {
            setSubmitting(false);
          }
          // Reset flag to allow future submissions if needed
          dateSelectSubmittedRef.current = false;
        }, 1500);
      }, 100);
    } catch (error) {
      console.error('Error in date selection:', error);
      // Reset flag to allow retry
      dateSelectSubmittedRef.current = false;
      setSubmitting(false);
    }
  }, [
    date,
    onDateSelect,
    state,
    submitting,
    effectiveAppointmentType,
    setDate,
    setStep,
    chatOptions,
  ]);

  // Create a new handler for calendar selection that will automatically submit
  const handleSelect = React.useCallback(
    (newDate: Date | undefined) => {
      if (!newDate) return;

      setLocalDate(newDate);

      // Use a short timeout to allow state to update before submitting
      setTimeout(() => {
        if (newDate && !dateSelectSubmittedRef.current) {
          handleDateSubmit();
        }
      }, 100);
    },
    [handleDateSubmit],
  );

  const isDateDisabled = React.useCallback(
    (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return (
        date < today ||
        date.getDay() === 0 || // Sunday
        date.getDay() === 6 || // Saturday
        // Check if date is in availableDates
        (availableDates.length > 0 &&
          !availableDates.includes(date.toISOString().split('T')[0]))
      );
    },
    [availableDates],
  );

  // If loading, use the CalendarLoader component
  if (loading) {
    return <CalendarLoader />;
  }

  return (
    <CalendarContainer
      title="Select a date for your appointment"
      subtitle={`Available dates for ${effectiveAppointmentType}`}
      className={className}
      dataComponent="DatePicker"
    >
      <div className="bg-[#1450ef]/20 rounded-lg p-2 shadow-sm">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={isDateDisabled}
          initialFocus
          className="rounded-md text-[#f4e9dc]"
        />
      </div>

      <SubmittingIndicator text="Selecting date..." submitting={submitting} />
    </CalendarContainer>
  );
}
