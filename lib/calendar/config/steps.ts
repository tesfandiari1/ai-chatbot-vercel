/**
 * Calendar Step Configuration
 *
 * This file contains the configuration for each step in the calendar appointment flow.
 * Separating this configuration makes the AppointmentFlow component simpler and more focused.
 */

import type {
  BookingStep,
  AppointmentType,
  CalendarContext,
  SelectionContext,
} from '../types';
import { handleCalendarInteraction } from '../utils';

/**
 * Get context data for a specific booking step
 */
export function getStepContext(
  step: BookingStep,
  data: any = {},
): Partial<CalendarContext> {
  switch (step) {
    case 'date':
      return {
        appointmentType: data?.appointmentType || 'consultation',
        currentStep: 'date',
        autoAdvance: true,
      };

    case 'time':
      return {
        selectedDate: data?.date,
        selectedTimeSlot: null,
        appointmentType: data?.appointmentType || 'consultation',
        currentStep: 'time',
        autoAdvance: true,
      };

    case 'details':
      return {
        selectedDate: data?.date,
        selectedTimeSlot: data?.timeSlot,
        appointmentType: data?.appointmentType || 'consultation',
        currentStep: 'details',
        autoAdvance: true,
      };

    case 'confirmation':
      return {
        selectedDate: data?.appointment?.date || null,
        selectedTimeSlot: data?.appointment?.timeSlot || null,
        appointmentType: data?.appointment?.appointmentType || 'consultation',
        currentStep: 'confirmation',
        autoAdvance: false,
      };

    case 'search':
      return {
        appointmentType: 'consultation',
        currentStep: 'search',
        autoAdvance: false,
      };

    default:
      return {
        currentStep: 'date',
        autoAdvance: true,
      };
  }
}

/**
 * Get instructions text for a specific booking step
 */
export function getStepInstructions(step: BookingStep): string {
  switch (step) {
    case 'date':
      return 'Please select a date for your appointment.';
    case 'time':
      return 'Please select a time for your appointment.';
    case 'details':
      return 'Please provide your contact information.';
    case 'confirmation':
      return '';
    case 'search':
      return 'Searching for appointments...';
    default:
      return '';
  }
}

/**
 * Get the date step props
 */
export function getDateStepProps(data: any, chatFunctions: any) {
  return {
    availableDates: data?.availableDates || [],
    appointmentType: data?.appointmentType || 'consultation',
    selectedDate: undefined,
    chatOptions: chatFunctions,
    autoAdvance: true,
  };
}

/**
 * Get the time step props
 */
export function getTimeStepProps(data: any, chatFunctions: any) {
  return {
    selectedDate: data?.date || '',
    selectedTimeSlot: null,
    bookedSlots: data?.bookedSlots || [],
    onTimeSlotSelect: (timeSlot: string, context?: SelectionContext) => {
      handleCalendarInteraction(
        'time',
        { date: data?.date, timeSlot },
        context,
        {
          setInput: chatFunctions?.setInput,
          submit: chatFunctions?.submit,
        },
      );
    },
    autoAdvance: true,
    chatOptions: chatFunctions,
  };
}

/**
 * Get the details step props
 */
export function getDetailsStepProps(data: any, chatFunctions: any) {
  return {
    date: data?.date || '',
    timeSlot: data?.timeSlot || '',
    onSubmit: (formData: any, context?: SelectionContext) => {
      handleCalendarInteraction(
        'form',
        { date: data?.date, timeSlot: data?.timeSlot, ...formData },
        context,
        {
          setInput: chatFunctions?.setInput,
          submit: chatFunctions?.submit,
        },
      );
    },
    chatOptions: chatFunctions,
  };
}

/**
 * Get the confirmation step props
 */
export function getConfirmationStepProps(data: any) {
  return {
    appointment: data?.appointment || {
      date: null,
      timeSlot: null,
      appointmentType: 'consultation' as AppointmentType,
      name: '',
      email: '',
      phone: '',
    },
  };
}

/**
 * Get the search step props
 */
export function getSearchStepProps(data: any, chatFunctions: any) {
  return {
    events: data?.events || [],
    query: data?.query || '',
    totalEvents: data?.totalEvents || 0,
    onEventCancel: (eventId: string) => {
      if (chatFunctions?.setInput && chatFunctions?.submit) {
        chatFunctions.setInput(`Cancel my appointment with ID: ${eventId}`);
        setTimeout(() => chatFunctions.submit(), 50);
      }
    },
  };
}

/**
 * Get props for a specific booking step
 */
export function getStepProps(
  step: BookingStep,
  data: any = {},
  chatFunctions: any = {},
) {
  switch (step) {
    case 'date':
      return getDateStepProps(data, chatFunctions);
    case 'time':
      return getTimeStepProps(data, chatFunctions);
    case 'details':
      return getDetailsStepProps(data, chatFunctions);
    case 'confirmation':
      return getConfirmationStepProps(data);
    case 'search':
      return getSearchStepProps(data, chatFunctions);
    default:
      return {};
  }
}
