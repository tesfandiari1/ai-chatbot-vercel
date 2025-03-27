# Calendar Fixes: Immediate Action Plan

## Priority 1: Fix Loading & UI Refresh Issues

### Issue
The calendar frequently shows "Loading calendar..." and appears to reload unnecessarily, primarily due to inefficient loading state management and simulated API delays.

### Action Steps

1. **Consolidate Loading States** (Time estimate: 2 hours)
   ```typescript
   // In client.tsx - Replace multiple loading states
   type LoadingReason = 'auth' | 'timeSlots' | 'none';
   const [loadingReason, setLoadingReason] = useState<LoadingReason>('none');
   const isLoading = loadingReason !== 'none';
   ```

2. **Optimize Auth Check Effect** (Time estimate: 1 hour)
   ```typescript
   // Add a reference to track if we've already checked auth
   const authCheckedRef = useRef(false);
   
   useEffect(() => {
     if (session?.user?.id && !authCheckedRef.current) {
       setLoadingReason('auth');
       authCheckedRef.current = true;
       
       checkGoogleCalendarAuth(session.user.id)
         .then((isAuthenticated) => {
           updateMetadata({ isAuthenticated });
         })
         .finally(() => {
           setLoadingReason((prev) => (prev === 'auth' ? 'none' : prev));
         });
     }
   }, [session, updateMetadata]);
   ```

3. **Remove Artificial Delay** (Time estimate: 30 minutes)
   ```typescript
   // Replace setTimeout with immediate data setting
   useEffect(() => {
     if (safeMetadata.selectedDate && safeMetadata.isAuthenticated) {
       setLoadingReason('timeSlots');
       
       // Immediately set the data without delay
       updateMetadata({
         availableTimeSlots: [
           { startTime: '5:00pm', endTime: '5:30pm', meetingTypeId: '30min' },
           { startTime: '5:30pm', endTime: '6:00pm', meetingTypeId: '30min' },
           { startTime: '6:00pm', endTime: '7:00pm', meetingTypeId: '60min' },
           { startTime: '7:00pm', endTime: '8:00pm', meetingTypeId: '60min' },
         ],
       });
       
       setLoadingReason((prev) => (prev === 'timeSlots' ? 'none' : prev));
     }
   }, [safeMetadata.selectedDate, safeMetadata.isAuthenticated, updateMetadata]);
   ```

## Priority 2: Fix Styling Inconsistencies

### Issue
Calendar cells have inconsistent styling, particularly days 17-31 with dark backgrounds. The multiple methods of applying styles are causing conflicts.

### Action Steps

1. **Consolidate CSS Approach** (Time estimate: 2 hours)
   - Remove the `CalendarStyleLoader` component entirely
   - Migrate all needed styles to the CSS file
   - Use consistent class naming convention

2. **Fix Button Styling** (Time estimate: 1 hour)
   ```typescript
   // In DatePicker.tsx - Use consistent variant
   <Button
     key={`day-${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`}
     variant="ghost"
     size="sm"
     className={cn(
       'h-8 w-8 p-0 rounded-md flex items-center justify-center',
       !day.isCurrentMonth && 'text-muted-foreground opacity-50',
       isSelected && 'bg-primary text-primary-foreground font-medium',
       isDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer',
     )}
     disabled={isDisabled}
     onClick={() => onDateSelect(dateString)}
   >
     {day.date.getDate()}
   </Button>
   ```

3. **Fix Z-index Issues** (Time estimate: 1 hour)
   - Update the CSS to use a consistent stacking context
   - Remove all inline z-index manipulations
   ```css
   /* In calendar.css */
   .calendar-wrapper {
     position: relative;
     /* Use a higher stacking context */
     z-index: 1;
   }
   
   .calendar-wrapper .grid button {
     position: relative;
     z-index: auto; /* Let the natural DOM order determine stacking */
   }
   ```

## Priority 3: Optimize Performance

### Issue
Components re-render excessively, causing performance problems.

### Action Steps

1. **Memoize Event Handlers** (Time estimate: 1 hour)
   ```typescript
   // Memoize handlers
   const handleDateSelect = useCallback((date: string) => {
     updateMetadata({ selectedDate: date });
   }, [updateMetadata]);
   
   const handleTimeSlotSelect = useCallback((
     timeSlot: string,
     meetingType: string,
     duration: number
   ) => {
     updateMetadata({
       selectedTimeSlot: timeSlot,
       selectedMeetingType: meetingType,
       duration,
     });
   }, [updateMetadata]);
   ```

2. **Optimize Component Props** (Time estimate: 1 hour)
   ```typescript
   // Use memoized handlers instead of inline functions
   <DatePicker
     selectedDate={safeMetadata.selectedDate}
     onDateSelect={handleDateSelect}
   />
   
   <TimePicker
     selectedTimeSlot={safeMetadata.selectedTimeSlot}
     availableTimeSlots={safeMetadata.availableTimeSlots}
     onTimeSlotSelect={handleTimeSlotSelect}
   />
   ```

## Total Effort Estimate: 9.5 hours

### Testing Plan
- Test calendar in both light and dark modes
- Test on different browsers (Chrome, Firefox, Safari)
- Verify proper rendering of all dates
- Check for any loading flickers
- Ensure selection states work correctly

### Implementation Strategy
1. Start with loading state fixes (highest impact)
2. Apply styling fixes next
3. Implement performance optimizations last 