import { Suspense } from 'react';
import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { ChatErrorBoundary } from '@/components/error-boundary';

// Create a separate component for the dynamic part
async function ChatWithModel() {
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');
  const id = generateUUID();

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedChatModel={modelIdFromCookie?.value || DEFAULT_CHAT_MODEL}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}

// Loading component
function LoadingChat() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

// Main page component with static parts
export default function Page() {
  return (
    <ChatErrorBoundary>
      <Suspense fallback={<LoadingChat />}>
        <ChatWithModel />
      </Suspense>
    </ChatErrorBoundary>
  );
}
