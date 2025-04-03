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
import { handleCalendarInteraction } from '@/lib/ai/utils/calendar-interface';
import { enhancedCalendarInteraction } from '@/lib/ai/utils/auto-calendar';
import { useState, useCallback, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import {
  useCalendarContext,
  useCalendarActions,
  createSelectionContext,
} from '@/lib/calendar/context';

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

      // Call the enhanced handler to advance to next step with proper options
      // This uses more aggressive submission tactics to ensure progression
      const fullContext = {
        ...selectionContext,
        autoAdvance: true, // Always force auto advance
      };

      // Add a small delay to ensure state updates complete before submission
      setTimeout(() => {
        enhancedCalendarInteraction('date', formattedDate, fullContext, {
          setInput: chatOptions?.setInput,
          sendMessage: chatOptions?.submit,
          debug: true,
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
        !availableDates.includes(date.toISOString().split('T')[0])
      );
    },
    [availableDates],
  );

  if (loading) {
    return (
      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl p-4 max-w-[500px] bg-[#140556] border border-[#1450ef] animate-pulse',
          className,
        )}
        data-component="DatePicker"
      >
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-[180px] bg-[#1450ef]/30" />
          <Skeleton className="h-4 w-[100px] bg-[#1450ef]/30" />
        </div>
        <div className="h-[300px] bg-[#1450ef]/20 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl p-4 max-w-[500px] bg-[#140556] border border-[#1450ef]',
        className,
      )}
      data-component="DatePicker"
    >
      <div className="flex flex-col space-y-1">
        <h2 className="text-xl font-medium text-[#f4e9dc]">
          Select a date for your appointment
        </h2>
        <p className="text-sm text-[#f4e9dc]/80">
          {`Available dates for ${effectiveAppointmentType}`}
        </p>
      </div>

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

      {submitting && (
        <div className="flex items-center justify-center w-full py-2 text-[#f4e9dc]">
          <Spinner size="sm" className="mr-2" />
          <span>Selecting date...</span>
        </div>
      )}
    </div>
  );
}
