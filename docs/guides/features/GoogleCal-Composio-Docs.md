Tools
Googlecalendar

Learn how to use Googlecalendar with Composio

Overview
Enum
GOOGLECALENDAR

Description
Google Calendar is a time-management and scheduling calendar service developed by Google.

Authentication Details
OAUTH2
client_id
string
Required
Client id of the app

client_secret
string
Required
Client secret of the app

oauth_redirect_uri
string
Defaults to https://backend.composio.dev/api/v1/auth-apps/add
Add this Redirect URL to your app`s OAuth allow list.

scopes
string
Defaults to https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events
Scopes to request from the user, comma separated

BEARER_TOKEN
Actions
GOOGLECALENDAR_QUICK_ADD
Create a new event in a google calendar based on a simple text string like appointment at somewhere on june 3rd 10am-10:25am you can only give title and timeslot here. no recurring meetings and no attendee can be added here. this is not a preferred endpoint. only use this if no other endpoint is possible.

Action Parameters

calendar_id
string
Defaults to primary
Calendar identifier. To list calendars to retrieve calendar IDs use relevant tools. To access the primary calendar of the currently logged in user, use the primary keyword.

text
string
The text describing the event to be created.

send_updates
string
Defaults to none
Guests who should receive notifications about the creation of the new event.

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_DELETE_EVENT
Delete an event from a google calendar.

Action Parameters

calendar_id
string
Defaults to primary
ID of the Google Calendar

event_id
string
Required
ID of the event to be deleted

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_LIST_CALENDARS
Action to list all google calendars from the user`s calendar list with pagination.

Action Parameters

max_results
integer
Defaults to 10
Maximum number of entries returned on one result page. The page size can never be larger than 250 entries.

min_access_role
string
The minimum access role for the user in the returned entries.

page_token
string
Token specifying which result page to return.

show_deleted
boolean
Whether to include deleted calendar list entries in the result.

show_hidden
boolean
Whether to show hidden entries.

sync_token
string
Token obtained from the nextSyncToken field returned on the last page of results from the previous list request.

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_REMOVE_ATTENDEE
Remove an attendee from an existing event in a google calendar.

Action Parameters

calendar_id
string
Defaults to primary
ID of the Google Calendar

event_id
string
Required
ID of the event

attendee_email
string
Required
Email address of the attendee to be removed

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_DUPLICATE_CALENDAR
Action to duplicate a google calendar based on the provided summary. the duplicated calendar can be used similarly to manage other goals.

Action Parameters

summary
string
Title of the calendar to be duplicated.

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_GET_CURRENT_DATE_TIME
Action to get the current date and time of a specified timezone, given its utc offset value.

Action Parameters

timezone
number
The timezone offset from UTC to retrieve current date and time, like for location of UTC+6, you give 6, for UTC -9, your give -9.

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_UPDATE_EVENT
Update an existing event in a google calendar.

Action Parameters

description
string
Description of the event. Can contain HTML. Optional.

eventType
string
Defaults to default
Type of the event, immutable post-creation. Currently, only “default and workingLocation” can be created.

create_meeting_room
boolean
If true, a Google Meet link is created and added to the event.

guestsCanSeeOtherGuests
boolean
Whether attendees other than the organizer can see who the event`s attendees are.

guestsCanInviteOthers
boolean
Whether attendees other than the organizer can invite others to the event.

location
string
Geographic location of the event as free-form text.

summary
string
Summary (title) of the event.

transparency
string
Defaults to opaque
“opaque (busy) or transparent” (available).

visibility
string
Defaults to default
Event visibility: “default, public”, “private, or confidential”.

timezone
string
IANA timezone name (e.g., America/New_York). Required if datetime is naive. If datetime includes timezone info (Z or offset), this field is optional and defaults to UTC.

recurrence
array
List of RRULE, EXRULE, RDATE, EXDATE lines for recurring events.

guests_can_modify
boolean
If True, guests can modify the event.

attendees
array
List of attendee emails (strings).

send_updates
boolean
Defaults to True. Whether to send updates to the attendees.

start_datetime
string
Required
Naive date/time (YYYY-MM-DDTHH:MM:SS) with NO offsets or Z. e.g. 2025-01-16T13:00:00

event_duration_hour
integer
Number of hours (0-24). Increase by 1 here rather than passing 60 in event_duration_minutes

event_duration_minutes
integer
Defaults to 30
Number of minutes (0-59). Make absolutely sure this is less than 60.

calendar_id
string
Defaults to primary
ID of the Google Calendar

event_id
string
Required
ID of the event to be updated

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_PATCH_CALENDAR
Action to update a google calendar based on the provided calendar id and other required and optional parameters. note that summary is a mandatory parameter. use googlecalendar list calendars action to get the list of calendars and their ids.

Action Parameters

calendar_id
string
Required
The ID of the Google Calendar that needs to be updated.

description
string
Description of the calendar. Optional.

location
string
Geographic location of the calendar as free-form text.

summary
string
Required
Title of the calendar. This field is required and cannot be left blank as per the Google Calendar API requirements.

timezone
string
The time zone of the calendar. (Formatted as an IANA Time Zone Database name, e.g. Europe/Zurich).

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_FIND_FREE_SLOTS
Find free slots in a google calendar based on for a specific time period.

Action Parameters

time_min
string
The start datetime of the interval for the query. Supports multiple formats:

ISO format with timezone (e.g., 2024-12-06T13:00:00Z)
Comma-separated format (e.g., 2024,12,06,13,00,00)
Simple datetime format (e.g., 2024-12-06 13:00:00)
time_max
string
The end datetime of the interval for the query. Supports multiple formats:

ISO format with timezone (e.g., 2024-12-06T13:00:00Z)
Comma-separated format (e.g., 2024,12,06,13,00,00)
Simple datetime format (e.g., 2024-12-06 13:00:00)
timezone
string
Defaults to UTC
Time zone used in the response. Optional. The default is UTC.

group_expansion_max
integer
Defaults to 100
Maximal number of calendar identifiers to be provided for a single group. Optional. An error is returned for a group with more members than this value. Maximum value is 100.

calendar_expansion_max
integer
Defaults to 50
Maximal number of calendars for which FreeBusy information is to be provided. Optional. Maximum value is 50.

items
array
Defaults to ['primary']
List of calendars ids for which to fetch

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_CREATE_EVENT
Create a new event in a google calendar.

Action Parameters

description
string
Description of the event. Can contain HTML. Optional.

eventType
string
Defaults to default
Type of the event, immutable post-creation. Currently, only “default and workingLocation” can be created.

create_meeting_room
boolean
If true, a Google Meet link is created and added to the event.

guestsCanSeeOtherGuests
boolean
Whether attendees other than the organizer can see who the event`s attendees are.

guestsCanInviteOthers
boolean
Whether attendees other than the organizer can invite others to the event.

location
string
Geographic location of the event as free-form text.

summary
string
Summary (title) of the event.

transparency
string
Defaults to opaque
“opaque (busy) or transparent” (available).

visibility
string
Defaults to default
Event visibility: “default, public”, “private, or confidential”.

timezone
string
IANA timezone name (e.g., America/New_York). Required if datetime is naive. If datetime includes timezone info (Z or offset), this field is optional and defaults to UTC.

recurrence
array
List of RRULE, EXRULE, RDATE, EXDATE lines for recurring events.

guests_can_modify
boolean
If True, guests can modify the event.

attendees
array
List of attendee emails (strings).

send_updates
boolean
Defaults to True. Whether to send updates to the attendees.

start_datetime
string
Required
Naive date/time (YYYY-MM-DDTHH:MM:SS) with NO offsets or Z. e.g. 2025-01-16T13:00:00

event_duration_hour
integer
Number of hours (0-24). Increase by 1 here rather than passing 60 in event_duration_minutes

event_duration_minutes
integer
Defaults to 30
Number of minutes (0-59). Make absolutely sure this is less than 60.

calendar_id
string
Defaults to primary
The ID of the Google Calendar. primary for interacting with the primary calendar.

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_FIND_EVENT
Find events in a google calendar based on a search query.

Action Parameters

calendar_id
string
Defaults to primary
Identifier of the Google Calendar. Use primary for the currently logged in user`s primary calendar.

query
string
Search term to find events that match these terms in the event”s summary, description, location, attendees displayName, attendees email, organizer”s displayName, organizer`s email, etc if needed.

max_results
integer
Defaults to 10
Maximum number of events returned on one result page. The page size can never be larger than 2500 events. The default value is 10.

order_by
string
The order of the events returned in the result. Acceptable values are “startTime and updated”.

show_deleted
boolean
Whether to include deleted events (with status equals cancelled) in the result.

single_events
boolean
Defaults to True
Whether to expand recurring events into instances and only return single one-off events and instances of recurring events, but not the underlying recurring events themselves.

timeMax
string
Upper bound (exclusive) for an event`s start time to filter by. Accepts multiple formats:

ISO format with timezone (e.g., 2024-12-06T13:00:00Z)
Comma-separated format (e.g., 2024,12,06,13,00,00)
Simple datetime format (e.g., 2024-12-06 13:00:00)
timeMin
string
Lower bound (exclusive) for an event`s end time to filter by. Accepts multiple formats:

ISO format with timezone (e.g., 2024-12-06T13:00:00Z)
Comma-separated format (e.g., 2024,12,06,13,00,00)
Simple datetime format (e.g., 2024-12-06 13:00:00)
updated_min
string
Lower bound for an event`s last modification time to filter by. Accepts multiple formats:

ISO format with timezone (e.g., 2024-12-06T13:00:00Z)
Comma-separated format (e.g., 2024,12,06,13,00,00)
Simple datetime format (e.g., 2024-12-06 13:00:00)
event_types
array
Defaults to ['default', 'outOfOffice', 'focusTime', 'workingLocation']
List of event types to return. Possible values are: default, outOfOffice, focusTime, workingLocation.

page_token
string
Token specifying which result page to return. Optional.

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action

GOOGLECALENDAR_GET_CALENDAR
Action to fetch a calendar based on the provided calendar id.

Action Parameters

calendar_id
string
Defaults to primary
The ID of the Google Calendar that needs to be fetched. Default is primary.

Action Response

data
object
Data from the action execution

successful
boolean
Whether or not the action execution was successful or not

error
Error if any occurred during the execution of the action