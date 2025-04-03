'use client';

// Core React and UI imports
import { memo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import equal from 'fast-deep-equal';
import cx from 'classnames';
import { cn } from '@/lib/utils';

// Types
import type { UIMessage } from 'ai';
import type { Vote } from '@/lib/db/schema';
import type { UseChatHelpers } from '@ai-sdk/react';

// UI Components
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

// Message Components
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { MessageEditor } from './message-editor';
import { MessageReasoning } from './message-reasoning';

// Tool-specific Components
import { Weather } from './weather';
import { DocumentToolCall, DocumentToolResult } from './document';
import { DocumentPreview } from './document-preview';
import { renderCalendarTool, renderCalendarToolCall } from './calendar';

// Constants for tool names to improve maintainability
const CALENDAR_TOOL_NAMES = [
  'getCalendarAvailability',
  'getAvailableTimeSlots',
  'prepareAppointmentForm',
  'bookCalendarAppointment',
  'searchCalendarEvents',
  'cancelCalendarEvent',
];

const SKELETON_TOOLS = [
  'getWeather',
  'getCalendarAvailability',
  'getAvailableTimeSlots',
  'prepareAppointmentForm',
];

/**
 * Renders the appropriate component for a tool result
 * @param toolName The name of the tool
 * @param result The result data from the tool
 * @param isLoading Whether the UI is in loading state
 * @param isReadonly Whether the UI is in readonly mode
 * @returns The React component to display
 */
function renderToolResult(
  toolName: string,
  result: any,
  isLoading: boolean,
  isReadonly: boolean,
) {
  // Check if it's a calendar tool first
  if (CALENDAR_TOOL_NAMES.includes(toolName)) {
    return renderCalendarTool(toolName, result, isLoading);
  }

  // Handle other tool types
  switch (toolName) {
    case 'getWeather':
      return <Weather weatherAtLocation={result} />;
    case 'createDocument':
      return <DocumentPreview isReadonly={isReadonly} result={result} />;
    case 'updateDocument':
      return (
        <DocumentToolResult
          type="update"
          result={result}
          isReadonly={isReadonly}
        />
      );
    case 'requestSuggestions':
      return (
        <DocumentToolResult
          type="request-suggestions"
          result={result}
          isReadonly={isReadonly}
        />
      );
    default:
      return null;
  }
}

/**
 * Renders the appropriate component for a tool call (before result is received)
 * @param toolName The name of the tool
 * @param args The arguments passed to the tool
 * @param isLoading Whether the UI is in loading state
 * @param isReadonly Whether the UI is in readonly mode
 * @returns The React component to display
 */
function renderToolCall(
  toolName: string,
  args: any,
  isLoading: boolean,
  isReadonly: boolean,
) {
  // Check if it's a calendar tool first
  if (CALENDAR_TOOL_NAMES.includes(toolName)) {
    return renderCalendarToolCall(toolName, args, isLoading);
  }

  // Handle other tool types
  switch (toolName) {
    case 'getWeather':
      return <Weather />;
    case 'createDocument':
      return <DocumentPreview isReadonly={isReadonly} args={args} />;
    case 'updateDocument':
      return (
        <DocumentToolCall type="update" args={args} isReadonly={isReadonly} />
      );
    case 'requestSuggestions':
      return (
        <DocumentToolCall
          type="request-suggestions"
          args={args}
          isReadonly={isReadonly}
        />
      );
    default:
      return null;
  }
}

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full">
            {message.experimental_attachments && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                            message.role === 'user',
                        })}
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  // Determine if this tool should have skeleton loading style
                  const shouldShowSkeleton = SKELETON_TOOLS.includes(toolName);

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: shouldShowSkeleton,
                      })}
                    >
                      {renderToolCall(toolName, args, isLoading, isReadonly)}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {renderToolResult(
                        toolName,
                        result,
                        isLoading,
                        isReadonly,
                      )}
                    </div>
                  );
                }

                return null;
              }

              return null;
            })}

            {message.role !== 'user' && !isLoading && (
              <MessageActions
                chatId={chatId}
                vote={vote}
                message={message}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    return (
      prevProps.vote === nextProps.vote &&
      prevProps.isLoading === nextProps.isLoading &&
      equal(prevProps.message, nextProps.message)
    );
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
