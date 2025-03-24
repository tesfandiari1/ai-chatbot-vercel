import type { UIMessage } from 'ai';
import {
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { NextResponse } from 'next/server';

// Define consistent runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to access this chat' },
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (error) {
                console.error('Failed to save chat:', error);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        // Debug logging for reasoning extraction
        let reasoningDebug = '';
        // Access internal AI stream properties for debugging purposes
        // @ts-expect-error - Accessing stream implementation details for debugging
        const stream = result.rawStream;
        if (stream) {
          stream.on('data', (chunk: any) => {
            if (chunk.type === 'reasoning') {
              reasoningDebug += chunk.textDelta || '';
              console.log('Reasoning delta received:', chunk.textDelta);
            }
          });

          stream.on('end', () => {
            console.log('Total reasoning collected:', reasoningDebug);
          });
        }

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        console.error('Error in stream processing:', error);
        return 'Oops, an error occurred while processing your request. Please try again.';
      },
    });
  } catch (error) {
    console.error('Unexpected error in chat API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Chat ID is required' },
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const chat = await getChatById({ id });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this chat' },
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }

    await deleteChatById({ id });

    return NextResponse.json(
      { message: 'Chat deleted successfully' },
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the chat' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
