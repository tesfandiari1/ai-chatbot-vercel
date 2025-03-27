'use client';

import { format, addMonths, subMonths } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import '../styles/calendar.css';
import { CalendarStyleLoader } from './CalendarStyleLoader';

interface DatePickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

export function DatePicker({ selectedDate, onDateSelect }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 2)); // March 2025

  const handlePrevMonth = () => {
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
  };

  // Get calendar days including prev/next month padding
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of current month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Last day of current month (28-31)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Last day of previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Add days from previous month to fill the first row
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
      });
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
      });
    }

    // Add days from next month to complete the grid
    const totalDays = days.length;
    const remainingCells = 42 - totalDays; // Always show 6 rows of 7 days

    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const calendarDays = getCalendarDays();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="calendar-wrapper">
      <CalendarStyleLoader />
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day) => {
          const dateString = day.date.toISOString();
          const isSelected = selectedDate === dateString;
          const isDisabled = day.date < new Date() || !day.isCurrentMonth;

          return (
            <Button
              key={`day-${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`}
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-8 w-8 p-0 rounded-md flex items-center justify-center',
                !day.isCurrentMonth && 'text-muted-foreground opacity-50',
                isSelected &&
                  'font-medium bg-primary text-primary-foreground hover:bg-primary/90',
                !isSelected &&
                  day.isCurrentMonth &&
                  'bg-background hover:bg-accent hover:text-accent-foreground',
                isDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer',
              )}
              disabled={isDisabled}
              onClick={() => onDateSelect(dateString)}
            >
              {day.date.getDate()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
