'use client';

import React from 'react';
import { CalendarProvider } from '@/lib/calendar/context';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { AppointmentForm } from './AppointmentForm';
import { Confirmation } from './Confirmation';
import { EventSearchResults } from './EventSearchResults';
import type { AppointmentType } from '@/lib/calendar/types';
import {
  createCalendarComponentProps,
  callCalendarTool,
} from '@/lib/ai/utils/calendar-interface';

// Simple loader component for calendar tools
const CalendarLoader = () => (
  <div className="rounded-2xl p-4 max-w-[500px] bg-[#140556] border border-[#1450ef] animate-pulse">
    <div className="h-8 w-1/2 bg-[#1450ef]/30 rounded mb-4" />
    <div className="h-4 w-3/4 bg-[#1450ef]/30 rounded mb-6" />
    <div className="grid grid-cols-7 gap-2">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
        <div
          key={`cal-loader-header-${day}`}
          className="h-10 bg-[#1450ef]/30 rounded"
        />
      ))}
    </div>
    <div className="mt-4 grid grid-cols-7 gap-2">
      {Array(14)
        .fill(0)
        .map((_, i) => (
          <div
            key={`cal-loader-day-cell-${i + 1}`}
            className="h-10 bg-[#1450ef]/30 rounded"
          />
        ))}
    </div>
  </div>
);

// Calendar Tool Results Wrapper component for consistent styling and instructions
export function CalendarToolResult({
  children,
  instructions,
  isLoading,
}: {
  children: React.ReactNode;
  instructions?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {isLoading ? <CalendarLoader /> : children}
      {instructions && !isLoading && (
        <div className="mt-2 text-sm text-[#f4e9dc]/80">{instructions}</div>
      )}
    </div>
  );
}

interface ChatOptions {
  setInput?: (text: string) => void;
  submit?: () => void;
}

function getChatFunctions(): ChatOptions {
  return {
    setInput: (text: string) => {
      const form = document.querySelector(
        'form[data-message-form]',
      ) as HTMLFormElement;
      const input = form?.querySelector('textarea') as HTMLTextAreaElement;
      if (input) input.value = text;
    },
    submit: () => {
      const form = document.querySelector(
        'form[data-message-form]',
      ) as HTMLFormElement;
      if (form) {
        const submitButton = form.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;
        if (submitButton) submitButton.click();
        else form.requestSubmit();
      }
    },
  };
}

export function renderCalendarTool(
  toolName: string,
  result: any,
  isLoading: boolean,
) {
  const chatOptions = getChatFunctions();

  switch (toolName) {
    case 'getCalendarAvailability':
      return (
        <CalendarToolResult
          instructions={
            result.userInstructions || 'Click on an available date to continue'
          }
          isLoading={isLoading}
        >
          <CalendarProvider
            initialData={{
              appointmentType: result.appointmentType || 'consultation',
              autoAdvance: true,
              currentStep: 'date',
            }}
          >
            <DatePicker
              availableDates={result.availableDates || []}
              appointmentType={result.appointmentType || 'consultation'}
              loading={isLoading}
              selectedDate={undefined}
              chatOptions={chatOptions}
              autoAdvance={true}
              onDateSelect={(date, context) => {
                console.debug(
                  'DatePicker component selected date:',
                  date,
                  context,
                );
              }}
            />
          </CalendarProvider>
        </CalendarToolResult>
      );

    case 'getAvailableTimeSlots':
      return (
        <CalendarToolResult
          instructions={
            result.userInstructions || 'Click on a time slot to continue'
          }
          isLoading={isLoading}
        >
          <CalendarProvider
            initialData={{
              selectedDate: result.date,
              appointmentType: result.appointmentType || 'consultation',
              currentStep: 'time',
              autoAdvance: true,
            }}
          >
            <TimePicker
              {...createCalendarComponentProps(
                {
                  selectedDate: result.date,
                  selectedTimeSlot: null,
                  bookedSlots: [],
                  autoAdvance: true,
                  onTimeSlotSelect: (timeSlot, context) => {
                    console.debug(
                      'TimePicker component selected time:',
                      timeSlot,
                    );
                  },
                  callTool: (name: string, parameters: Record<string, any>) => {
                    console.debug(`Calling tool directly: ${name}`, parameters);
                    callCalendarTool(name, parameters)
                      .then((result: any) =>
                        console.debug(`Tool call result:`, result),
                      )
                      .catch((error: Error) =>
                        console.error(`Tool call error:`, error),
                      );
                  },
                  setInput: chatOptions.setInput,
                  sendMessage: chatOptions.submit,
                },
                'time',
              )}
            />
          </CalendarProvider>
        </CalendarToolResult>
      );

    case 'prepareAppointmentForm':
      return (
        <CalendarToolResult
          instructions={
            result.userInstructions ||
            'Fill out the form to complete your booking'
          }
          isLoading={isLoading}
        >
          <CalendarProvider
            initialData={{
              selectedDate: result.date,
              selectedTimeSlot: result.timeSlot,
              appointmentType: result.appointmentType || 'consultation',
              currentStep: 'details',
              autoAdvance: true,
            }}
          >
            <AppointmentForm
              {...createCalendarComponentProps(
                {
                  date: result.date,
                  timeSlot: result.timeSlot,
                  onSubmit: (data, context) => {
                    console.debug('AppointmentForm component submitted:', data);
                  },
                  callTool: (name: string, parameters: Record<string, any>) => {
                    console.debug(`Calling tool directly: ${name}`, parameters);
                    callCalendarTool(name, parameters)
                      .then((result: any) =>
                        console.debug(`Tool call result:`, result),
                      )
                      .catch((error: Error) =>
                        console.error(`Tool call error:`, error),
                      );
                  },
                  setInput: chatOptions.setInput,
                  sendMessage: chatOptions.submit,
                },
                'form',
              )}
            />
          </CalendarProvider>
        </CalendarToolResult>
      );

    case 'bookCalendarAppointment':
      if (!result.success) return null;

      return (
        <CalendarToolResult
          instructions={result.userInstructions}
          isLoading={isLoading}
        >
          <CalendarProvider
            initialData={{
              selectedDate: result.appointment?.date || null,
              selectedTimeSlot: result.appointment?.timeSlot || null,
              appointmentType:
                result.appointment?.appointmentType || 'consultation',
              currentStep: 'confirmation',
              autoAdvance: false,
            }}
          >
            <Confirmation
              appointment={
                result.appointment || {
                  date: null,
                  timeSlot: null,
                  appointmentType: 'consultation' as AppointmentType,
                  name: '',
                  email: '',
                  phone: '',
                }
              }
            />
          </CalendarProvider>
        </CalendarToolResult>
      );

    case 'searchCalendarEvents':
      return (
        <CalendarToolResult
          instructions={result.userInstructions}
          isLoading={isLoading}
        >
          <CalendarProvider
            initialData={{
              appointmentType: 'consultation',
              currentStep: 'search',
              autoAdvance: false,
            }}
          >
            <EventSearchResults
              events={result.events || []}
              query={result.query || ''}
              totalEvents={result.totalEvents || 0}
              onEventCancel={(eventId) => {
                // This will be handled by the chat
                const form = document.querySelector(
                  'form[data-message-form]',
                ) as HTMLFormElement;
                const input = form?.querySelector(
                  'textarea',
                ) as HTMLTextAreaElement;

                if (input && form) {
                  input.value = `Cancel my appointment with ID: ${eventId}`;
                  setTimeout(() => form.requestSubmit(), 50);
                }
              }}
            />
          </CalendarProvider>
        </CalendarToolResult>
      );

    case 'cancelCalendarEvent':
      return (
        <CalendarToolResult
          instructions={result.userInstructions}
          isLoading={isLoading}
        >
          <div className="bg-[#140556] p-4 rounded-2xl border border-[#1450ef]">
            <div className="flex items-center mb-2">
              <div
                className={`mr-2 text-lg ${result.success ? 'text-green-300' : 'text-red-300'}`}
              >
                {result.success ? '✓' : '✗'}
              </div>
              <h3 className="font-medium text-[#f4e9dc]">
                {result.success
                  ? 'Appointment Cancelled'
                  : 'Cancellation Failed'}
              </h3>
            </div>
            <p className="text-sm text-[#f4e9dc]/80">
              {result.success
                ? `Event ID: ${result.eventId} has been cancelled.`
                : result.errorMessage || 'Failed to cancel the appointment.'}
            </p>
          </div>
        </CalendarToolResult>
      );

    default:
      return null;
  }
}

// For handling calendar tools in 'call' state
export function renderCalendarToolCall(
  toolName: string,
  args: any,
  isLoading: boolean,
) {
  const chatOptions = getChatFunctions();

  switch (toolName) {
    case 'getCalendarAvailability':
      return (
        <CalendarToolResult
          isLoading={isLoading}
          instructions="Click on an available date to continue"
        >
          <CalendarProvider
            initialData={{
              appointmentType: args.appointmentType || 'consultation',
              autoAdvance: true,
              currentStep: 'date',
            }}
          >
            <DatePicker
              availableDates={args.availableDates || []}
              appointmentType={args.appointmentType || 'consultation'}
              loading={isLoading}
              selectedDate={undefined}
              chatOptions={chatOptions}
              autoAdvance={true}
              onDateSelect={(date, context) => {
                console.debug(
                  'DatePicker component selected date:',
                  date,
                  context,
                );
              }}
            />
          </CalendarProvider>
        </CalendarToolResult>
      );

    case 'getAvailableTimeSlots':
      return (
        <CalendarToolResult
          isLoading={isLoading}
          instructions="Click on a time slot to continue"
        >
          <CalendarProvider
            initialData={{
              selectedDate: args.date,
              appointmentType: args.appointmentType || 'consultation',
              currentStep: 'time',
              autoAdvance: true,
            }}
          >
            <TimePicker
              {...createCalendarComponentProps(
                {
                  selectedDate: args.date,
                  selectedTimeSlot: null,
                  bookedSlots: [],
                  autoAdvance: true,
                  onTimeSlotSelect: (timeSlot, context) => {
                    console.debug(
                      'TimePicker component selected time:',
                      timeSlot,
                    );
                  },
                  callTool: (name: string, parameters: Record<string, any>) => {
                    console.debug(`Calling tool directly: ${name}`, parameters);
                    callCalendarTool(name, parameters)
                      .then((result: any) =>
                        console.debug(`Tool call result:`, result),
                      )
                      .catch((error: Error) =>
                        console.error(`Tool call error:`, error),
                      );
                  },
                  setInput: chatOptions.setInput,
                  sendMessage: chatOptions.submit,
                },
                'time',
              )}
            />
          </CalendarProvider>
        </CalendarToolResult>
      );

    case 'prepareAppointmentForm':
      return (
        <CalendarToolResult
          isLoading={isLoading}
          instructions="Fill out the form to complete your booking"
        >
          <CalendarProvider
            initialData={{
              selectedDate: args.date,
              selectedTimeSlot: args.timeSlot,
              appointmentType: args.appointmentType || 'consultation',
              currentStep: 'details',
              autoAdvance: true,
            }}
          >
            <AppointmentForm
              {...createCalendarComponentProps(
                {
                  date: args.date,
                  timeSlot: args.timeSlot,
                  onSubmit: (data, context) => {
                    console.debug('AppointmentForm component submitted:', data);
                  },
                  callTool: (name: string, parameters: Record<string, any>) => {
                    console.debug(`Calling tool directly: ${name}`, parameters);
                    callCalendarTool(name, parameters)
                      .then((result: any) =>
                        console.debug(`Tool call result:`, result),
                      )
                      .catch((error: Error) =>
                        console.error(`Tool call error:`, error),
                      );
                  },
                  setInput: chatOptions.setInput,
                  sendMessage: chatOptions.submit,
                },
                'form',
              )}
            />
          </CalendarProvider>
        </CalendarToolResult>
      );

    case 'searchCalendarEvents':
      return (
        <CalendarToolResult isLoading={isLoading}>
          <div className="bg-[#140556] p-4 rounded-2xl border border-[#1450ef]">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-[#f4e9dc]">
                Searching Calendar
              </h3>
              <p className="text-sm text-[#f4e9dc]/80">
                Looking for events matching &quot;{args.query}
                &quot;...
              </p>
            </div>
          </div>
        </CalendarToolResult>
      );

    case 'cancelCalendarEvent':
      return (
        <CalendarToolResult isLoading={isLoading}>
          <div className="bg-[#140556] p-4 rounded-2xl border border-[#1450ef]">
            <div className="flex items-center mb-2">
              <div
                className={`mr-2 text-lg ${args.success ? 'text-green-300' : 'text-red-300'}`}
              >
                {args.success ? '✓' : '✗'}
              </div>
              <h3 className="font-medium text-[#f4e9dc]">
                {args.success ? 'Appointment Cancelled' : 'Cancellation Failed'}
              </h3>
            </div>
            <p className="text-sm text-[#f4e9dc]/80">
              {args.success
                ? `Event ID: ${args.eventId} has been cancelled.`
                : args.errorMessage || 'Failed to cancel the appointment.'}
            </p>
          </div>
        </CalendarToolResult>
      );

    default:
      return null;
  }
}
