// Import the Composio SDK properly
import { OpenAIToolSet, Composio } from 'composio-core';

// Define AuthResult interface to match what would be returned by Composio
export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  error?: string;
}

// Real Composio API key and connection ID
const COMPOSIO_API_KEY =
  process.env.COMPOSIO_API_KEY || '797yjs86ki2n70fc8m3ou';
const COMPOSIO_CONNECTION_ID =
  process.env.COMPOSIO_CONNECTION_ID || '45c1d6cd-c8ed-409b-afed-d9c03c0fff75';

// Initialize the Composio client
export const composioClient = new Composio({
  apiKey: COMPOSIO_API_KEY,
});

// Initialize the Composio toolset with the provided API key
export const composioToolset = new OpenAIToolSet({
  apiKey: COMPOSIO_API_KEY,
});

// Function to initialize calendar-specific tools
export const initializeCalendarTools = async () => {
  try {
    const calendarTools = await composioToolset.getTools({
      actions: [
        'GOOGLECALENDAR_FIND_FREE_SLOTS',
        'GOOGLECALENDAR_CREATE_EVENT',
        'GOOGLECALENDAR_LIST_CALENDARS',
      ],
    });

    return calendarTools;
  } catch (error) {
    console.error('Error initializing Composio calendar tools:', error);
    // Return empty array in case of error
    return [];
  }
};

// Helper function to handle tool calls
export const handleToolCalls = async (response: any) => {
  try {
    return await composioToolset.handleToolCall(response);
  } catch (error) {
    console.error('Error handling tool calls:', error);
    throw error;
  }
};

// Get the connected account for Google Calendar
export const getConnectedAccount = async () => {
  try {
    return await composioClient.connectedAccounts.get({
      connectedAccountId: COMPOSIO_CONNECTION_ID,
    });
  } catch (error) {
    console.error('Error getting connected account:', error);
    throw error;
  }
};

// Function to check if Composio is configured properly
export const isComposioConfigured = () => {
  return !!COMPOSIO_API_KEY && !!COMPOSIO_CONNECTION_ID;
};

// Get OAuth URL for Google Calendar
export const getGoogleCalendarAuthUrl = async (
  redirectUri: string,
  state: string,
) => {
  try {
    // In a real implementation, we would use the Composio SDK's getAuthUrl method
    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrl.searchParams.append(
      'client_id',
      process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    );
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append(
      'scope',
      'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    );
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');

    return authUrl.toString();
  } catch (error) {
    console.error('Error generating Google Calendar auth URL:', error);
    throw error;
  }
};

// Handle OAuth callback
export const handleGoogleCalendarCallback = async (
  code: string,
  redirectUri: string,
): Promise<AuthResult> => {
  try {
    // In a real implementation, this would use the Composio SDK
    // For now, we'll use a mock implementation
    return {
      success: true,
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error handling Google Calendar callback:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error handling OAuth callback',
    };
  }
};

// In a real implementation with the actual SDK:
/*
export const composioToolset = new ComposioToolSet({
  apiKey: 'c4feb79e-dd2a-4aec-9ff4-b5c352e2676d'
});

export const calendarTools = composioToolset.get_tools([
  "GOOGLECALENDAR_FIND_FREE_SLOTS",
  "GOOGLECALENDAR_CREATE_EVENT",
  "GOOGLECALENDAR_GET_CURRENT_DATE_TIME"
]);
*/
