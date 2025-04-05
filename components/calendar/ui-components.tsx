'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Spinner component for loading indicators across calendar components
 */
export const CalendarSpinner = ({
  size = 'default',
  className = '',
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

/**
 * Calendar loader skeleton for date picker
 */
export const CalendarLoader = () => (
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

/**
 * Time slots loader skeleton
 */
export const TimeSlotsLoader = () => {
  const slotSkeletons = Array(6).fill(0);
  
  return (
    <div className="space-y-6">
      <div>
        <div className="h-5 w-[100px] mb-2 bg-[#1450ef]/30" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {slotSkeletons.map((_, i) => (
            <div
              key={`morning-slot-${i}`}
              className="h-14 w-full bg-[#1450ef]/30"
            />
          ))}
        </div>
      </div>

      <div>
        <div className="h-5 w-[100px] mb-2 bg-[#1450ef]/30" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {slotSkeletons.map((_, i) => (
            <div
              key={`afternoon-slot-${i}`}
              className="h-14 w-full bg-[#1450ef]/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Form loader skeleton
 */
export const FormLoader = () => (
  <div className="space-y-4">
    <div>
      <div className="h-5 w-[80px] mb-2 bg-[#1450ef]/30" />
      <div className="h-10 w-full bg-[#1450ef]/30" />
    </div>

    <div>
      <div className="h-5 w-[80px] mb-2 bg-[#1450ef]/30" />
      <div className="h-10 w-full bg-[#1450ef]/30" />
    </div>

    <div>
      <div className="h-5 w-[120px] mb-2 bg-[#1450ef]/30" />
      <div className="h-10 w-full bg-[#1450ef]/30" />
    </div>

    <div>
      <div className="h-5 w-[150px] mb-2 bg-[#1450ef]/30" />
      <div className="h-20 w-full bg-[#1450ef]/30" />
      <div className="h-4 w-[70%] mt-2 bg-[#1450ef]/30" />
    </div>

    <div className="h-10 w-full mt-6 bg-[#1450ef]/30" />
  </div>
);

/**
 * Calendar Tool Results Wrapper component for consistent styling and instructions
 */
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

/**
 * Get chat form interaction functions for submitting messages
 */
export function getChatFunctions() {
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

/**
 * Calendar container for consistent styling across all calendar components
 */
export function CalendarContainer({
  children,
  title,
  subtitle,
  loading = false,
  error,
  className,
  dataComponent,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  className?: string;
  dataComponent: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl p-4 max-w-[500px] bg-[#140556] border border-[#1450ef]',
        className,
      )}
      data-component={dataComponent}
    >
      <div className="flex flex-col space-y-1">
        <h2 className="text-xl font-medium text-[#f4e9dc]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[#f4e9dc]/80">
            {subtitle}
          </p>
        )}
      </div>

      {error && (
        <div className="text-red-200 text-sm py-1 px-2 bg-red-900/20 rounded border border-red-800">
          {error}
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Loading indicator component for form submissions
 */
export function SubmittingIndicator({ 
  text, 
  submitting 
}: { 
  text: string; 
  submitting: boolean 
}) {
  if (!submitting) return null;
  
  return (
    <div className="flex items-center justify-center w-full py-2 text-[#f4e9dc]">
      <CalendarSpinner size="sm" className="mr-2" />
      <span>{text}</span>
    </div>
  );
}