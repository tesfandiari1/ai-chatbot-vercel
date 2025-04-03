'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  className?: string;
}

export function DatePicker({
  selectedDate,
  onDateSelect,
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined,
  );

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      onDateSelect(format(newDate, 'yyyy-MM-dd'));
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <h2 className="text-xl font-medium">Select a Date</h2>
        <p className="text-sm text-muted-foreground">
          Choose your preferred appointment date
        </p>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          className="rounded-md border"
          disabled={(date) => {
            // Disable past dates and weekends
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return (
              date < today ||
              date.getDay() === 0 || // Sunday
              date.getDay() === 6 // Saturday
            );
          }}
          initialFocus
        />
      </CardContent>
    </Card>
  );
}
