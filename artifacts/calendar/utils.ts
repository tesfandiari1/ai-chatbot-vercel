/**
 * Calculate the end time based on a start time and duration
 * @param startTime The starting time in format like "5:00pm"
 * @param duration Duration in minutes
 * @returns Formatted end time (e.g., "5:30pm")
 */
export function calculateEndTime(
  startTime: string | null,
  duration: number,
): string {
  if (!startTime) return '';

  try {
    // Parse the time (assuming format like "5:00pm")
    const timeMatch = startTime.match(/(\d+):(\d+)(am|pm)/i);
    if (!timeMatch) return '';

    let hours = Number.parseInt(timeMatch[1], 10);
    const minutes = Number.parseInt(timeMatch[2], 10);
    const period = timeMatch[3].toLowerCase();

    // Convert to 24-hour format
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    // Add duration
    let endHours = hours;
    let endMinutes = minutes + duration;

    // Handle minute overflow
    if (endMinutes >= 60) {
      endHours += Math.floor(endMinutes / 60);
      endMinutes %= 60;
    }

    // Convert back to 12-hour format
    let endPeriod = 'am';
    if (endHours >= 12) {
      endPeriod = 'pm';
      if (endHours > 12) endHours -= 12;
    }
    if (endHours === 0) endHours = 12;

    return `${endHours}:${endMinutes.toString().padStart(2, '0')}${endPeriod}`;
  } catch (error) {
    return '';
  }
}
