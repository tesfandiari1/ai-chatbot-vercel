/**
 * Enhanced auto-submission utilities for calendar components
 * This improves the user experience by ensuring calendar selections
 * properly advance the conversation without needing additional text input
 */

import { handleCalendarInteraction } from '@/lib/ai/utils/calendar-interface';
import type { SelectionContext } from '@/lib/calendar/types';

// Additional options for enhanced context
interface EnhancedContextOptions extends SelectionContext {
  forceSubmit?: boolean;
  retryCount?: number;
}

/**
 * Enhanced automatic calendar interaction handler
 * Wraps the standard handler with additional retries and debug info
 */
export function enhancedCalendarInteraction(
  interactionType: 'date' | 'time' | 'form',
  data: any,
  context?: SelectionContext,
  options?: any,
) {
  // Always ensure auto-advance is set
  const enhancedContext: EnhancedContextOptions = {
    ...context,
    autoAdvance: true,
  };

  console.debug(
    `[Enhanced] Calendar interaction: ${interactionType}`,
    data,
    enhancedContext,
  );

  // First try with standard handler
  const success = handleCalendarInteraction(
    interactionType,
    data,
    enhancedContext,
    options,
  );

  if (!success) {
    console.warn(
      `[Enhanced] Initial submission failed for ${interactionType}, trying fallback...`,
    );

    // Try additional fallback with delay
    setTimeout(() => {
      console.debug(
        `[Enhanced] Attempting fallback submission for ${interactionType}`,
      );

      // Create a separate context object with our enhanced props
      const fallbackContext: EnhancedContextOptions = {
        ...enhancedContext,
        // Force new attempt with stronger flags
        autoAdvance: true,
        forceSubmit: true,
        retryCount: 1,
      };

      handleCalendarInteraction(
        interactionType,
        data,
        fallbackContext,
        options,
      );
    }, 300);
  }

  return success;
}

/**
 * Get the chat form elements directly
 * This provides a more reliable way to interact with the chat
 */
export function getChatElements() {
  if (typeof document === 'undefined') return null;

  try {
    // Try to locate the form
    const form = document.querySelector(
      'form[data-message-form]',
    ) as HTMLFormElement;
    if (!form) return null;

    // Get textarea and submit button
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
    const submitBtn = form.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    if (!textarea || !submitBtn) return null;

    return { form, textarea, submitBtn };
  } catch (error) {
    console.error('Error getting chat elements:', error);
    return null;
  }
}

/**
 * Force-submit a message to the chat
 * This bypasses normal handling to ensure the message gets sent
 */
export function forceSubmitChatMessage(message: string): boolean {
  const elements = getChatElements();
  if (!elements) return false;

  const { form, textarea, submitBtn } = elements;

  try {
    // Set textarea value both directly and via property descriptor
    textarea.value = message;

    // Create and dispatch input event
    const inputEvent = new Event('input', { bubbles: true });
    textarea.dispatchEvent(inputEvent);

    // Focus the textarea
    textarea.focus();

    // Small delay before submitting
    setTimeout(() => {
      // Try both methods of submission
      if (submitBtn) {
        submitBtn.click();
      }

      try {
        form.requestSubmit();
      } catch (e) {
        console.warn('Form requestSubmit failed, trying standard submit');
        form.submit();
      }
    }, 50);

    return true;
  } catch (error) {
    console.error('Error force-submitting chat message:', error);
    return false;
  }
}
