/**
 * Calendar Utilities
 *
 * Core calendar functionality including:
 * 1. Form submission
 * 2. Step management
 * 3. Message formatting
 * 4. Tool execution
 */

import type {
  SelectionContext,
  CalendarContext,
  AppointmentType,
  ToolParameters,
} from './types';

// -----------------
// TYPES
// -----------------

/**
 * Options for calendar interaction
 */
export interface CalendarInteractionOptions {
  callTool?: (name: string, parameters: Record<string, any>) => void;
  setInput?: (text: string) => void;
  submit?: () => void;
}

/**
 * Formatted message structure
 */
export interface FormattedMessage {
  text: string;
  toolParameters?: Record<string, any>;
  nextTool?: string;
}

// -----------------
// FORM SUBMISSION
// -----------------

/**
 * Submit a message to the chat using direct DOM interaction
 * This is the standardized method for form submission
 */
export function submitChatMessage(message: string): boolean {
  if (typeof document === 'undefined') return false;

  try {
    // Locate the form
    const form = document.querySelector(
      'form[data-message-form]',
    ) as HTMLFormElement;
    if (!form) return false;

    // Find the textarea and submit button
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return false;

    // Set value and trigger input event
    textarea.value = message;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Submit form after a small delay to ensure the input is registered
    setTimeout(() => {
      const submitBtn = form.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;
      if (submitBtn) submitBtn.click();
    }, 50);

    return true;
  } catch (error) {
    console.error('Error submitting chat message:', error);
    return false;
  }
}

// -----------------
// FORMATTING
// -----------------

/**
 * Format date consistently
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format different interaction types into standardized messages
 */
export function formatCalendarMessage(
  interactionType: 'date' | 'time' | 'form',
  data: any,
  context?: SelectionContext,
): FormattedMessage {
  const appointmentType =
    context?.previousSelections?.appointmentType || 'consultation';

  switch (interactionType) {
    case 'date': {
      const date = data;
      const formattedDate = formatDate(date);

      return {
        text: `I'd like to book an appointment on ${formattedDate}`,
        toolParameters: { date, appointmentType },
        nextTool: 'getAvailableTimeSlots',
      };
    }

    case 'time': {
      const { date, timeSlot } = data;
      const formattedDate = formatDate(date);

      return {
        text: `I'd like to book an appointment on ${formattedDate} at ${timeSlot}`,
        toolParameters: { date, timeSlot, appointmentType },
        nextTool: 'prepareAppointmentForm',
      };
    }

    case 'form': {
      const { date, timeSlot, ...formData } = data;
      const formattedDate = formatDate(date);

      const text = `I'd like to book an appointment on ${formattedDate} at ${timeSlot}. 
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}${formData.notes ? `\nNotes: ${formData.notes}` : ''}`;

      return {
        text,
        toolParameters: { date, timeSlot, appointmentType, ...formData },
        nextTool: 'bookCalendarAppointment',
      };
    }

    default:
      return { text: '' };
  }
}

// -----------------
// INTERACTION HANDLING
// -----------------

/**
 * Main handler for all calendar component interactions
 * Uses a single, consistent approach for interaction
 */
export function handleCalendarInteraction(
  interactionType: 'date' | 'time' | 'form',
  data: any,
  context?: SelectionContext,
  options?: CalendarInteractionOptions,
): boolean {
  // Format the message for this interaction
  const formattedMessage = formatCalendarMessage(
    interactionType,
    data,
    context,
  );

  // Prioritize direct tool calling if available
  if (
    options?.callTool &&
    formattedMessage.nextTool &&
    formattedMessage.toolParameters
  ) {
    try {
      options.callTool(
        formattedMessage.nextTool,
        formattedMessage.toolParameters,
      );
      return true;
    } catch (error) {
      console.error('Error calling tool directly:', error);
    }
  }

  // Fall back to direct DOM submission as the standard approach
  return submitChatMessage(formattedMessage.text);
}

// -----------------
// COMPONENT PROP CREATION
// -----------------

/**
 * Create props for a calendar component with standardized interaction handling
 */
export function createCalendarComponentProps<T extends Record<string, any>>(
  baseProps: T,
  interactionType: 'date' | 'time' | 'form',
  options?: CalendarInteractionOptions,
): T {
  // Create handler function for this specific interaction type
  const handleInteraction = (data: any, context?: SelectionContext) => {
    return handleCalendarInteraction(interactionType, data, context, options);
  };

  // Return modified props with the appropriate handler
  switch (interactionType) {
    case 'date':
      return {
        ...baseProps,
        onDateSelect: (date: string, context?: SelectionContext) => {
          handleInteraction(date, context);
          // Call original handler if it exists
          if (baseProps.onDateSelect) baseProps.onDateSelect(date, context);
        },
        autoAdvance: true,
      };

    case 'time':
      return {
        ...baseProps,
        onTimeSlotSelect: (timeSlot: string, context?: SelectionContext) => {
          handleInteraction(
            { date: baseProps.selectedDate, timeSlot },
            context,
          );
          // Call original handler if it exists
          if (baseProps.onTimeSlotSelect)
            baseProps.onTimeSlotSelect(timeSlot, context);
        },
        autoAdvance: true,
      };

    case 'form':
      return {
        ...baseProps,
        onSubmit: (formData: any, context?: SelectionContext) => {
          handleInteraction(
            {
              date: baseProps.date,
              timeSlot: baseProps.timeSlot,
              ...formData,
            },
            context,
          );
          // Call original handler if it exists
          if (baseProps.onSubmit) baseProps.onSubmit(formData, context);
        },
        autoAdvance: true,
      };

    default:
      return baseProps;
  }
}

// -----------------
// TOOL MANAGEMENT
// -----------------

/**
 * Map steps to tool names
 */
export const STEP_TO_TOOL_MAP = {
  date: 'getAvailableTimeSlots',
  time: 'prepareAppointmentForm',
  details: 'bookCalendarAppointment',
  search: 'searchCalendarEvents',
  cancel: 'cancelCalendarEvent',
};

/**
 * Map tool names to steps
 */
export const TOOL_TO_STEP_MAP = {
  getCalendarAvailability: 'date',
  getAvailableTimeSlots: 'time',
  prepareAppointmentForm: 'details',
  bookCalendarAppointment: 'confirmation',
  searchCalendarEvents: 'search',
  cancelCalendarEvent: 'cancel',
};

/**
 * Determine next tool based on current step
 */
export function determineNextCalendarTool(
  currentStep: string,
): string | undefined {
  return STEP_TO_TOOL_MAP[currentStep as keyof typeof STEP_TO_TOOL_MAP];
}

/**
 * Create selection context from calendar context
 * @deprecated Use createSelectionContext from context.tsx instead
 */
export function createToolSelectionContext(calendarContext: CalendarContext) {
  return {
    autoAdvance: calendarContext.autoAdvance,
    previousSelections: calendarContext,
  };
}
