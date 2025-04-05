'use client';

import React from 'react';
import { CalendarProvider } from '@/lib/calendar/context';
import type { BookingStep } from '@/lib/calendar/types';
import { CalendarToolResult, getChatFunctions } from './ui-components';
import {
  getStepComponent,
  getStepContext,
  getStepInstructions,
  getStepProps,
} from '@/lib/calendar/config/index';

/**
 * AppointmentFlow Props Interface
 */
interface AppointmentFlowProps {
  /**
   * The current step in the booking process
   */
  step: BookingStep;

  /**
   * Data for the current step
   */
  data: Record<string, any>;

  /**
   * Whether the step is in a loading state
   */
  isLoading?: boolean;

  /**
   * Whether this is a tool call (before result is available)
   */
  isToolCall?: boolean;

  /**
   * Optional instructions to display above the component
   */
  instructions?: string;
}

/**
 * A unified appointment flow component that handles all steps of the booking process.
 * This component coordinates the rendering of different steps in the calendar booking flow.
 *
 * It's responsible for:
 * 1. Determining which component to render based on the current step
 * 2. Providing the appropriate context and props for that component
 * 3. Managing the display of instructions and loading states
 */
export function AppointmentFlow({
  step,
  data = {},
  isLoading = false,
  isToolCall = false,
  instructions,
}: AppointmentFlowProps) {
  // Get chat functions for form submission
  const chatFunctions = getChatFunctions();

  // Get the component to render for this step
  const StepComponent = getStepComponent(step);

  // Get context for the current step
  const contextData = getStepContext(step, data);

  // Get props for the component
  const componentProps = getStepProps(step, data, chatFunctions);

  // Determine instructions to display
  const effectiveInstructions = instructions || getStepInstructions(step);

  return (
    <CalendarToolResult
      instructions={effectiveInstructions}
      isLoading={isLoading}
    >
      <CalendarProvider initialData={contextData}>
        <StepComponent {...componentProps} loading={isLoading} />
      </CalendarProvider>
    </CalendarToolResult>
  );
}
