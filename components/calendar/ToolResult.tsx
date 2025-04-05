'use client';

import React from 'react';
import { AppointmentFlow } from './AppointmentFlow';
import type { BookingStep } from '@/lib/calendar/types';
import { CalendarSpinner } from './ui-components';
import { TOOL_TO_STEP_MAP } from '@/lib/calendar/utils';

/**
 * CalendarToolResultProps - Props for the CalendarToolResult component
 */
interface CalendarToolResultProps {
  /**
   * Tool name for tool-based rendering (optional if children are provided)
   */
  toolName?: string;

  /**
   * Data for the tool result (optional if children are provided)
   */
  data?: Record<string, any>;

  /**
   * Whether content is in a loading state
   */
  isLoading?: boolean;

  /**
   * Whether this is a tool call (before result is available)
   */
  isToolCall?: boolean;

  /**
   * Optional child components to render (alternative to tool-based rendering)
   */
  children?: React.ReactNode;

  /**
   * Optional instructions to display above the component
   */
  instructions?: string;
}

/**
 * CalendarToolResult - A component that handles rendering of calendar tool results
 *
 * This component has two operating modes:
 * 1. Children mode: Renders provided children with loading/instructions wrapper
 * 2. Tool mode: Renders a tool result based on toolName and data
 */
export function CalendarToolResult({
  toolName,
  data,
  isLoading = false,
  isToolCall = false,
  children,
  instructions,
}: CalendarToolResultProps) {
  // If children are provided, use the wrapper mode
  if (children) {
    return (
      <CalendarResultWrapper instructions={instructions} isLoading={isLoading}>
        {children}
      </CalendarResultWrapper>
    );
  }

  // Without required props for tool mode, return nothing
  if (!toolName || !data) {
    return null;
  }

  // Special case for cancelCalendarEvent which doesn't use AppointmentFlow
  if (toolName === 'cancelCalendarEvent') {
    return <CancelEventResult data={data} isLoading={isLoading} />;
  }

  // Map tool name to step
  const step =
    (TOOL_TO_STEP_MAP[
      toolName as keyof typeof TOOL_TO_STEP_MAP
    ] as BookingStep) || 'date';

  // Use AppointmentFlow to render the appropriate component
  return (
    <AppointmentFlow
      step={step}
      data={data}
      isLoading={isLoading}
      isToolCall={isToolCall}
      instructions={data.userInstructions}
    />
  );
}

/**
 * CalendarResultWrapper - A wrapper component for calendar results
 */
interface CalendarResultWrapperProps {
  children: React.ReactNode;
  instructions?: string;
  isLoading?: boolean;
}

function CalendarResultWrapper({
  children,
  instructions,
  isLoading = false,
}: CalendarResultWrapperProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {instructions && !isLoading && (
        <div className="text-sm text-[#f4e9dc]/80 mb-2">{instructions}</div>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <CalendarSpinner className="mr-2" />
          <p className="text-[#f4e9dc]">Loading calendar...</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * CancelEventResult - Component for rendering cancel event results
 */
interface CancelEventResultProps {
  data: Record<string, any>;
  isLoading: boolean;
}

function CancelEventResult({ data, isLoading }: CancelEventResultProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {isLoading ? (
        <div className="bg-[#140556] p-4 rounded-2xl border border-[#1450ef] flex items-center">
          <CalendarSpinner className="mr-2" />
          <p className="text-[#f4e9dc]">Cancelling appointment...</p>
        </div>
      ) : (
        <div className="bg-[#140556] p-4 rounded-2xl border border-[#1450ef]">
          <div className="flex items-center mb-2">
            <div
              className={`mr-2 text-lg ${data.success ? 'text-green-300' : 'text-red-300'}`}
            >
              {data.success ? '✓' : '✗'}
            </div>
            <h3 className="font-medium text-[#f4e9dc]">
              {data.success ? 'Appointment Cancelled' : 'Cancellation Failed'}
            </h3>
          </div>
          <p className="text-sm text-[#f4e9dc]/80">
            {data.success
              ? `Event ID: ${data.eventId} has been cancelled.`
              : data.errorMessage || 'Failed to cancel the appointment.'}
          </p>
        </div>
      )}
      {data.userInstructions && !isLoading && (
        <div className="mt-2 text-sm text-[#f4e9dc]/80">
          {data.userInstructions}
        </div>
      )}
    </div>
  );
}
