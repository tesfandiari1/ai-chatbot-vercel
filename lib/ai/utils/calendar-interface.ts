/**
 * Calendar Interface
 *
 * Unified API for calendar interactions combining:
 * 1. Direct AI SDK tool calling
 * 2. DOM interaction fallbacks
 * 3. Context management
 * 4. Component prop creation
 */

import type { SelectionContext } from '@/lib/calendar/types';
import type { Tool } from 'ai';

// -----------------
// TYPES
// -----------------

// Declare global window interface with AI SDK tools
declare global {
  interface Window {
    __AI_SDK_TOOLS__?: Record<string, Tool>;
  }
}

export interface CalendarInteractionOptions {
  setInput?: (text: string) => void;
  sendMessage?: (options?: any) => void;
  callTool?: (name: string, parameters: Record<string, any>) => void;
  debug?: boolean;
}

export interface FormattedMessage {
  text: string;
  toolParameters?: Record<string, any>;
  nextTool?: string;
}

// -----------------
// CONTEXT MANAGEMENT
// -----------------

/**
 * Store the selection context in a location accessible to AI SDK tools
 */
export function storeCalendarContext(context?: SelectionContext) {
  if (!context) return;

  debug('Storing calendar context', context);

  // Store in sessionStorage for persistence between steps
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('calendarContext', JSON.stringify(context));
    } catch (error) {
      debug('Error storing context in sessionStorage', error);
    }
  }
}

/**
 * Retrieve stored calendar context
 */
export function getCalendarContext(): Record<string, any> {
  if (typeof window !== 'undefined') {
    try {
      const storedContext = sessionStorage.getItem('calendarContext');
      if (storedContext) {
        return JSON.parse(storedContext);
      }
    } catch (error) {
      console.error('Error retrieving calendar context:', error);
    }
  }

  // Return default context
  return {
    currentStep: 'date',
    appointmentType: 'consultation',
  };
}

// -----------------
// TOOL CALLING
// -----------------

/**
 * Call a calendar tool directly through the AI SDK
 * Falls back to mock implementation during development
 */
export async function callCalendarTool(
  name: string,
  parameters: Record<string, any>,
): Promise<any> {
  console.debug(`Calendar tool call: ${name}`, parameters);

  // TODO: Technical debt - update this to use proper types when AI SDK types are available
  // Try to find tool in global context if available
  if (typeof window !== 'undefined' && window.__AI_SDK_TOOLS__) {
    try {
      const tools = window.__AI_SDK_TOOLS__;
      const tool = tools[name];

      if (tool && typeof tool.execute === 'function') {
        // Use the AI SDK tool directly
        return tool.execute(parameters, {
          // We use any type here because the exact ToolExecutionOptions structure
          // is not fully known/documented across different AI SDK versions
          applicationState: { previousSelections: getCalendarContext() },
        } as any);
      }
    } catch (error) {
      console.error(`Error using AI SDK tool ${name}:`, error);
      // Continue to fallback implementation
    }
  }

  // FALLBACK: Mock implementation for development/testing
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        switch (name) {
          case 'getAvailableTimeSlots':
            resolve({
              date: parameters.date,
              availableSlots: ['9:00am', '10:00am', '2:00pm', '3:00pm'],
              appointmentType: parameters.appointmentType || 'consultation',
              success: true,
            });
            break;

          case 'prepareAppointmentForm':
            resolve({
              date: parameters.date,
              timeSlot: parameters.timeSlot,
              appointmentType: parameters.appointmentType || 'consultation',
              success: true,
            });
            break;

          case 'bookCalendarAppointment':
            resolve({
              success: true,
              appointment: {
                date: parameters.date,
                timeSlot: parameters.timeSlot,
                name: parameters.name,
                email: parameters.email,
                phone: parameters.phone,
                notes: parameters.notes,
                appointmentType: parameters.appointmentType || 'consultation',
              },
              message: `Appointment booked successfully for ${parameters.date} at ${parameters.timeSlot}`,
            });
            break;

          default:
            reject(new Error(`Unknown calendar tool: ${name}`));
        }
      } catch (error) {
        reject(error);
      }
    }, 500);
  });
}

// -----------------
// DOM INTERACTION
// -----------------

/**
 * Find the chat form in the DOM using multiple selector strategies
 */
function findChatForm(): HTMLFormElement | null {
  const possibleSelectors = [
    'form[data-message-form]',
    'form.message-form',
    'form:has(textarea)',
    'form.chat-form',
    'form',
  ];

  for (const selector of possibleSelectors) {
    try {
      const form = document.querySelector(selector) as HTMLFormElement;
      if (form?.querySelector('textarea')) return form;
    } catch (error) {
      console.debug(`Error trying selector ${selector}:`, error);
    }
  }

  // If we get here, try a more aggressive approach
  try {
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.find((form) => form.querySelector('textarea')) || null;
  } catch (error) {
    console.error('Error finding form with aggressive approach:', error);
    return null;
  }
}

/**
 * Attempt to submit the form with multiple strategies and error handling
 */
function attemptFormSubmission(message: string): boolean {
  try {
    const form = findChatForm();

    if (!form) {
      console.error('Could not find chat form after multiple attempts');
      return false;
    }

    const input = form.querySelector('textarea');
    if (!input) {
      console.error('Could not find textarea in chat form');
      return false;
    }

    // Set input value and trigger input event
    input.value = message;
    const inputEvent = new Event('input', { bubbles: true });
    input.dispatchEvent(inputEvent);

    // Try multiple submission methods
    try {
      // Find submit button and click it
      const submitButton = form.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;
      if (submitButton) {
        submitButton.click();
        console.debug('Form submitted via button click');
        return true;
      }

      // Try form.requestSubmit() method (modern browsers)
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
        console.debug('Form submitted via requestSubmit()');
        return true;
      }

      // Fallback to form.submit() if needed
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      console.debug('Form submitted via submit event');
      return true;
    } catch (error) {
      console.error('Error during form submission:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in form submission attempt:', error);
    return false;
  }
}

// -----------------
// MESSAGE FORMATTING
// -----------------

/**
 * Format different interaction types into standardized messages
 */
export function formatCalendarMessage(
  interactionType: 'date' | 'time' | 'form',
  data: any,
  context?: SelectionContext,
): FormattedMessage {
  switch (interactionType) {
    case 'date': {
      const date = data;
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        text: `I'd like to book an appointment on ${formattedDate}`,
        toolParameters: {
          date,
          appointmentType:
            context?.previousSelections?.appointmentType || 'consultation',
        },
        nextTool: 'getAvailableTimeSlots',
      };
    }

    case 'time': {
      const { date, timeSlot } = data;
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        text: `I'd like to book an appointment on ${formattedDate} at ${timeSlot}`,
        toolParameters: {
          date,
          timeSlot,
          appointmentType:
            context?.previousSelections?.appointmentType || 'consultation',
        },
        nextTool: 'prepareAppointmentForm',
      };
    }

    case 'form': {
      const { date, timeSlot, ...formData } = data;
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      // Format a comprehensive message with all form data
      const text = `I'd like to book an appointment on ${formattedDate} at ${timeSlot}. 
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}${formData.notes ? `\nNotes: ${formData.notes}` : ''}`;

      return {
        text,
        toolParameters: {
          date,
          timeSlot,
          appointmentType:
            context?.previousSelections?.appointmentType || 'consultation',
          ...formData,
        },
        nextTool: 'bookCalendarAppointment',
      };
    }

    default:
      return { text: '' };
  }
}

// -----------------
// MAIN INTERACTION HANDLER
// -----------------

/**
 * Main handler for all calendar component interactions
 * Supports multiple strategies for tool calling and form submission
 */
export function handleCalendarInteraction(
  interactionType: 'date' | 'time' | 'form',
  data: any,
  context?: SelectionContext,
  options?: CalendarInteractionOptions,
) {
  console.debug(`Calendar interaction: ${interactionType}`, data, context);

  // Format the message for this interaction
  const formattedMessage = formatCalendarMessage(
    interactionType,
    data,
    context,
  );

  // Store context for future tool calls
  storeCalendarContext(context);

  let success = false;

  // STRATEGY 1: Use AI SDK to directly call the next tool (preferred approach)
  if (
    options?.callTool &&
    formattedMessage.nextTool &&
    formattedMessage.toolParameters
  ) {
    try {
      console.debug(
        `Calling tool ${formattedMessage.nextTool} with parameters:`,
        formattedMessage.toolParameters,
      );
      options.callTool(
        formattedMessage.nextTool,
        formattedMessage.toolParameters,
      );
      success = true;
      return true;
    } catch (error) {
      console.error('Error calling tool directly:', error);
      // Fall back to next strategy
    }
  }

  // STRATEGY 2: Use setInput/sendMessage approach if provided
  if (!success && options?.setInput && options?.sendMessage) {
    try {
      // Set the input text first
      options.setInput(formattedMessage.text);

      // Use a small timeout to ensure the input is set before sending
      setTimeout(() => {
        try {
          options.sendMessage?.();
          success = true;
        } catch (innerError) {
          console.error('Error sending message:', innerError);
        }
      }, 250);

      return true;
    } catch (error) {
      console.error('Error using message-based approach:', error);
      // Fall back to next strategy
    }
  }

  // STRATEGY 3: Direct DOM manipulation with retries
  if (!success && typeof document !== 'undefined') {
    // Try immediate submission
    if (attemptFormSubmission(formattedMessage.text)) {
      success = true;
      return true;
    }

    // If failed, try again with increasing delays
    const retryDelays = [500, 1000, 2000];
    let attemptCount = 0;

    for (const delay of retryDelays) {
      setTimeout(() => {
        if (success) return; // Don't retry if another method succeeded

        attemptCount++;
        console.debug(`Retry attempt ${attemptCount} after ${delay}ms`);
        if (attemptFormSubmission(formattedMessage.text)) {
          success = true;
        }
      }, delay);
    }
  }

  if (!success) {
    console.warn(
      'All submission strategies failed for interaction:',
      interactionType,
    );
  }

  return success;
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
) {
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
          if (baseProps.onDateSelect) {
            baseProps.onDateSelect(date, context);
          }
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
          if (baseProps.onTimeSlotSelect) {
            baseProps.onTimeSlotSelect(timeSlot, context);
          }
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
          if (baseProps.onSubmit) {
            baseProps.onSubmit(formData, context);
          }
        },
        autoAdvance: true,
      };

    default:
      return baseProps;
  }
}

// -----------------
// TOOL COMPOSITION HELPERS
// -----------------

/**
 * Determine next tool based on current context
 */
export function determineNextCalendarTool(
  currentStep: string,
  data?: Record<string, any>,
): string | undefined {
  switch (currentStep) {
    case 'date':
      return 'getAvailableTimeSlots';
    case 'time':
      return 'prepareAppointmentForm';
    case 'details':
      return 'bookCalendarAppointment';
    case 'confirmation':
      return undefined;
    default:
      return undefined;
  }
}

// Type guard for tools with execute method
function hasExecuteMethod(
  tool: any,
): tool is { execute: (params: any, options?: any) => Promise<any> } {
  return (
    typeof tool === 'object' &&
    tool !== null &&
    typeof tool.execute === 'function'
  );
}

/**
 * Execute a sequence of calendar tools with context preservation
 */
export async function executeCalendarToolSequence(
  tools: Record<string, Tool>,
  startingTool: string,
  initialParams: any,
) {
  // Get existing context
  const initialContext = getCalendarContext();

  let currentTool = startingTool;
  let params = initialParams;
  let context = initialContext;

  // Execute each tool in sequence
  while (currentTool && tools[currentTool]) {
    try {
      const tool = tools[currentTool];

      // Verify the tool has an execute method
      if (!hasExecuteMethod(tool)) {
        console.error(`Tool ${currentTool} does not have an execute method`);
        break;
      }

      // Execute the current tool
      const result = await tool.execute(params, {
        // Use a type that matches what's available in the AI SDK
        // The exact shape may vary based on AI SDK version
        state: { previousSelections: context },
      });

      // Update context from result
      if (result?.applicationContext) {
        context = { ...context, ...result.applicationContext };
        storeCalendarContext(context as SelectionContext);
      }

      // Determine next tool
      const nextTool =
        result?.nextTool || determineNextCalendarTool(currentTool, result);

      if (nextTool && tools[nextTool]) {
        // Prepare parameters for next tool
        params = {
          ...params,
          ...(result?.toolParameters || {}),
        };
        currentTool = nextTool;
      } else {
        break;
      }
    } catch (error) {
      console.error(`Error executing calendar tool ${currentTool}:`, error);
      break;
    }
  }
}

// -----------------
// DEBUG INTERFACE
// -----------------

interface DebugOptions {
  enabled: boolean;
  verbose: boolean;
  logToConsole: boolean;
  logToDOM: boolean;
}

let debugOptions: DebugOptions = {
  enabled: false,
  verbose: false,
  logToConsole: true,
  logToDOM: false,
};

/**
 * Configure the debug options for the calendar interface
 */
export function configureCalendarDebug(options: Partial<DebugOptions>): void {
  debugOptions = { ...debugOptions, ...options };

  // Create debug element if DOM logging is enabled
  if (
    debugOptions.enabled &&
    debugOptions.logToDOM &&
    typeof document !== 'undefined'
  ) {
    createOrUpdateDebugElement();
  }

  debug('Calendar debug configured', debugOptions);
}

/**
 * Debug logger that respects configuration options
 */
export function debug(message: string, data?: any): void {
  if (!debugOptions.enabled) return;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    data: debugOptions.verbose ? data : undefined,
  };

  // Console logging
  if (debugOptions.logToConsole) {
    console.debug(`[Calendar] ${message}`, data);
  }

  // DOM logging
  if (debugOptions.logToDOM && typeof document !== 'undefined') {
    appendToDebugLog(logEntry);
  }
}

/**
 * Create or update the debug element in the DOM
 */
function createOrUpdateDebugElement(): HTMLElement {
  let debugElement = document.getElementById('calendar-debug-panel');

  if (!debugElement) {
    debugElement = document.createElement('div');
    debugElement.id = 'calendar-debug-panel';
    debugElement.style.position = 'fixed';
    debugElement.style.bottom = '10px';
    debugElement.style.right = '10px';
    debugElement.style.width = '300px';
    debugElement.style.maxHeight = '300px';
    debugElement.style.overflowY = 'auto';
    debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugElement.style.color = '#00ff00';
    debugElement.style.fontFamily = 'monospace';
    debugElement.style.fontSize = '12px';
    debugElement.style.padding = '10px';
    debugElement.style.borderRadius = '5px';
    debugElement.style.zIndex = '10000';

    // Create header
    const header = document.createElement('div');
    header.textContent = 'Calendar Debug';
    header.style.borderBottom = '1px solid #00ff00';
    header.style.marginBottom = '5px';
    header.style.paddingBottom = '5px';

    // Create log container
    const logContainer = document.createElement('div');
    logContainer.id = 'calendar-debug-log';

    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Hide';
    toggleButton.style.position = 'absolute';
    toggleButton.style.top = '5px';
    toggleButton.style.right = '5px';
    toggleButton.style.backgroundColor = 'transparent';
    toggleButton.style.border = '1px solid #00ff00';
    toggleButton.style.color = '#00ff00';
    toggleButton.style.cursor = 'pointer';

    toggleButton.addEventListener('click', () => {
      const log = document.getElementById('calendar-debug-log');
      if (log) {
        log.style.display = log.style.display === 'none' ? 'block' : 'none';
        toggleButton.textContent =
          log.style.display === 'none' ? 'Show' : 'Hide';
      }
    });

    // Add clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.position = 'absolute';
    clearButton.style.top = '5px';
    clearButton.style.right = '50px';
    clearButton.style.backgroundColor = 'transparent';
    clearButton.style.border = '1px solid #00ff00';
    clearButton.style.color = '#00ff00';
    clearButton.style.cursor = 'pointer';

    clearButton.addEventListener('click', () => {
      const log = document.getElementById('calendar-debug-log');
      if (log) log.innerHTML = '';
    });

    debugElement.appendChild(header);
    debugElement.appendChild(toggleButton);
    debugElement.appendChild(clearButton);
    debugElement.appendChild(logContainer);

    document.body.appendChild(debugElement);
  }

  return debugElement;
}

/**
 * Append a log entry to the debug panel
 */
function appendToDebugLog(logEntry: {
  timestamp: string;
  message: string;
  data?: any;
}): void {
  const logContainer = document.getElementById('calendar-debug-log');

  if (logContainer) {
    const entry = document.createElement('div');
    entry.style.borderBottom = '1px dotted #333';
    entry.style.paddingBottom = '3px';
    entry.style.marginBottom = '3px';

    const time = document.createElement('span');
    time.textContent = `${logEntry.timestamp.split('T')[1].split('.')[0]}: `;
    time.style.color = '#888';

    const message = document.createElement('span');
    message.textContent = logEntry.message;

    entry.appendChild(time);
    entry.appendChild(message);

    if (logEntry.data !== undefined) {
      const dataEl = document.createElement('pre');
      dataEl.textContent = JSON.stringify(logEntry.data, null, 2);
      dataEl.style.color = '#aaf';
      dataEl.style.marginTop = '3px';
      dataEl.style.fontSize = '10px';
      dataEl.style.maxHeight = '100px';
      dataEl.style.overflowY = 'auto';
      entry.appendChild(dataEl);
    }

    logContainer.appendChild(entry);

    // Limit the number of entries to 100
    while (logContainer.children.length > 100) {
      if (logContainer.firstChild) {
        logContainer.removeChild(logContainer.firstChild);
      }
    }

    // Scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
  }
}

/**
 * Get the current state of all calendar components and context
 */
export function getCalendarDebugState(): Record<string, any> {
  const state = {
    context: getCalendarContext(),
    dom: {
      formFound: !!findChatForm(),
      componentsRendered: {
        datePicker: !!document.querySelector('[data-component="DatePicker"]'),
        timePicker: !!document.querySelector('[data-component="TimePicker"]'),
        appointmentForm: !!document.querySelector(
          '[data-component="AppointmentForm"]',
        ),
        confirmation: !!document.querySelector(
          '[data-component="Confirmation"]',
        ),
      },
    },
    tools:
      typeof window !== 'undefined'
        ? !!(window as any).__AI_SDK_TOOLS__
        : false,
    browser: {
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      language:
        typeof navigator !== 'undefined' ? navigator.language : 'unknown',
    },
  };

  debug('Calendar debug state retrieved', state);
  return state;
}

// -----------------
// DEPRECATED FUNCTIONS
// -----------------

/**
 * @deprecated Use executeCalendarToolSequence instead
 */
export function composeCalendarTools(
  tools: Tool[],
  options: { parameterMapping: Record<string, (prev: any) => any> },
) {
  console.warn(
    'composeCalendarTools is deprecated. Use executeCalendarToolSequence instead.',
  );

  // Convert tools array to a map
  const toolMap = tools.reduce(
    (acc, tool) => {
      if (
        typeof tool === 'object' &&
        tool !== null &&
        'name' in tool &&
        typeof tool.name === 'string'
      ) {
        acc[tool.name] = tool;
      }
      return acc;
    },
    {} as Record<string, Tool>,
  );

  // Return a function that wraps the new implementation
  return async function executeTool(
    startingTool: string,
    initialParams: any,
    initialContext?: any,
  ) {
    if (initialContext) {
      storeCalendarContext({ previousSelections: initialContext });
    }

    await executeCalendarToolSequence(toolMap, startingTool, initialParams);

    // Return a compatible result object
    return {
      results: {},
      finalContext: getCalendarContext(),
    };
  };
}

/**
 * @deprecated Use executeCalendarToolSequence instead
 */
export function startCalendarBookingFlow(
  tools: Record<string, Tool>,
  appointmentType: string,
) {
  console.warn(
    'startCalendarBookingFlow is deprecated. Use executeCalendarToolSequence instead.',
  );

  // Start the flow with the getCalendarAvailability tool
  return executeCalendarToolSequence(tools, 'getCalendarAvailability', {
    appointmentType,
  });
}

/**
 * @deprecated Use Promise.all with individual tool calls instead
 */
export async function executeToolsInParallel(
  tools: Record<string, Tool>,
  toolsToExecute: Array<{ toolName: string; params: any }>,
  context?: any,
) {
  console.warn(
    'executeToolsInParallel is deprecated. Use Promise.all with individual tool calls instead.',
  );

  // Create an array of promises for each tool execution
  const toolPromises = toolsToExecute.map(async (config) => {
    try {
      const tool = tools[config.toolName];
      if (!tool || typeof tool.execute !== 'function') {
        throw new Error(`Tool ${config.toolName} not found or invalid`);
      }

      // TODO: Technical debt - update this to use proper types when AI SDK types are available
      // Execute the tool with context as applicationState
      const result = await tool.execute(config.params, {
        applicationState: { previousSelections: context },
      } as any);

      return { toolName: config.toolName, result };
    } catch (error) {
      console.error(`Error executing tool ${config.toolName}:`, error);
      return { toolName: config.toolName, error };
    }
  });

  // Execute all tools in parallel
  const executionResults = await Promise.all(toolPromises);

  // Process results
  const results: Record<string, any> = {};
  executionResults.forEach(({ toolName, result }) => {
    results[toolName] = result;
  });

  return { results, mergedContext: context || {} };
}

/**
 * @deprecated Use custom tool execution instead
 */
export async function checkMultipleDatesAvailability(
  tools: Record<string, Tool>,
  dates: string[],
  appointmentType: string,
) {
  console.warn(
    'checkMultipleDatesAvailability is deprecated. Use custom tool execution instead.',
  );

  // Create tool configs for each date
  const toolConfigs = dates.map((date) => ({
    toolName: 'getAvailableTimeSlots',
    params: { date, appointmentType },
  }));

  // Execute all availability checks in parallel
  return executeToolsInParallel(tools, toolConfigs);
}

/**
 * @deprecated Use custom tool execution instead
 */
export async function initializeBookingWithPreferences(
  tools: Record<string, Tool>,
  appointmentType: string,
  date?: string,
) {
  console.warn(
    'initializeBookingWithPreferences is deprecated. Use custom tool execution instead.',
  );

  // Define a more complete type for the parameters to avoid linter errors
  interface AvailabilityParams {
    appointmentType: string;
    date?: string;
  }

  const toolsToExecute = [
    {
      toolName: 'getCalendarAvailability',
      params: { appointmentType } as AvailabilityParams,
    },
  ];

  // If we have a date, also get time slots for it
  if (date) {
    toolsToExecute.push({
      toolName: 'getAvailableTimeSlots',
      params: {
        date,
        appointmentType,
      } as AvailabilityParams,
    });
  }

  return executeToolsInParallel(tools, toolsToExecute);
}
