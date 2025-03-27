'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface CalendarContainerProps {
  children: ReactNode;
  isLoading?: boolean;
}

export function CalendarContainer({
  children,
  isLoading = false,
}: CalendarContainerProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Card className="w-full max-w-md p-4 flex items-center justify-center h-[350px]">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
            <span>Loading calendar...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm overflow-visible">
        {children}
      </Card>
    </div>
  );
}
