// Document tools
export { createDocument } from './create-document';
export { updateDocument } from './update-document';
export { requestSuggestions } from './request-suggestions';

// Weather tool
export { getWeather } from './get-weather';

// Calendar tools
export {
  getCalendarAvailability,
  getAvailableTimeSlots,
  prepareAppointmentForm,
  bookCalendarAppointment,
  searchCalendarEvents,
  cancelCalendarEvent,
} from './calendar-tools';

// Calendar interface utilities
export {
  determineNextCalendarTool,
  createCalendarComponentProps,
  handleCalendarInteraction,
  formatCalendarMessage,
  STEP_TO_TOOL_MAP,
  TOOL_TO_STEP_MAP,
} from '@/lib/calendar/utils';

// Tool registration system
import type { Tool } from 'ai';

export type ToolRegistry = Record<string, Tool>;

export function registerTools<T extends ToolRegistry>(
  tools: T,
  options?: { validateTools?: boolean },
): T {
  if (options?.validateTools) {
    validateTools(tools);
  }

  // In browser contexts, make tools available globally for the calendar interface
  if (typeof window !== 'undefined') {
    (window as any).__AI_SDK_TOOLS__ = tools;
  }

  return tools;
}

function validateTools(tools: ToolRegistry): void {
  const required = [
    'getCalendarAvailability',
    'getAvailableTimeSlots',
    'prepareAppointmentForm',
    'bookCalendarAppointment',
  ];

  const missing = required.filter((name) => !tools[name]);

  if (missing.length > 0) {
    console.warn(
      `Calendar system may not function correctly. Missing tools: ${missing.join(', ')}`,
    );
  }

  Object.entries(tools).forEach(([name, tool]) => {
    if (
      !tool ||
      typeof tool !== 'object' ||
      typeof tool.execute !== 'function'
    ) {
      console.error(
        `Invalid tool definition for "${name}". Tool must have an execute method.`,
      );
    }
  });
}
