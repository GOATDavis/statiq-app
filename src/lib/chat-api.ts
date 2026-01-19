import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";
const ngrokHeaders = { 'ngrok-skip-browser-warning': 'true' };

// ============================================================================
// CHAT TYPES
// ============================================================================

export interface ChatRoom {
  id: number;
  room_type: 'team' | 'game' | 'general' | 'district';
  room_name: string;
  game_id: number | null;
  team_id: number | null;
  is_active: boolean;
  is_accessible: boolean;
  message_count: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  user_id: number;
  user_name: string;
  message_text: string;
  was_censored: boolean;
  created_at: string;
}

export interface SendMessageResponse {
  success: boolean;
  message_id: number;
  was_censored: boolean;
}

// ============================================================================
// AUTH TOKEN HELPERS
// ============================================================================

async function getAuthToken(): Promise<string | null> {
  try {
    // Debug: log all keys in AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('[Chat API] All AsyncStorage keys:', allKeys);
    
    // The backend looks up users by email, so we need the email
    // Try multiple storage keys that AuthContext might use
    
    // 1. Try user_email first (used by AuthContext)
    let email = await AsyncStorage.getItem('user_email');
    if (email) {
      console.log('[Chat API] Found email from user_email:', email);
      return email;
    }
    
    // 2. Try mock_user (used in MOCK_BACKEND mode)
    const mockUserStr = await AsyncStorage.getItem('mock_user');
    if (mockUserStr) {
      const mockUser = JSON.parse(mockUserStr);
      if (mockUser.email) {
        console.log('[Chat API] Found email from mock_user:', mockUser.email);
        return mockUser.email;
      }
    }
    
    // 3. Try user_data (alternate storage format)
    const userDataStr = await AsyncStorage.getItem('user_data');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      if (userData.email) {
        console.log('[Chat API] Found email from user_data:', userData.email);
        return userData.email;
      }
    }
    
    // 4. Try auth_token directly (might be email in some auth flows)
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      console.log('[Chat API] Found auth_token:', token);
      return token;
    }
    
    console.log('[Chat API] No auth token found in any storage key');
    return null;
  } catch (error) {
    console.error('[Chat API] Error getting auth token:', error);
    return null;
  }
}

// ============================================================================
// CHAT API FUNCTIONS
// ============================================================================

/**
 * Get or create a team chat room
 */
export async function getTeamChatRoom(teamId: number): Promise<ChatRoom> {
  const resp = await fetch(`${API_BASE}/chat/team/${teamId}`, {
    headers: ngrokHeaders,
  });

  if (!resp.ok) {
    throw new Error(`Failed to get team chat: ${resp.status}`);
  }

  return resp.json();
}

/**
 * Get or create a game chat room
 * Note: Will throw 403 if game chat is closed
 */
export async function getGameChatRoom(gameId: number): Promise<ChatRoom> {
  console.log('[Chat API] Getting game chat room for game:', gameId);
  const resp = await fetch(`${API_BASE}/chat/game/${gameId}`, {
    headers: ngrokHeaders,
  });

  if (!resp.ok) {
    if (resp.status === 403) {
      throw new Error('CHAT_CLOSED');
    }
    throw new Error(`Failed to get game chat: ${resp.status}`);
  }

  const room = await resp.json();
  console.log('[Chat API] Got game chat room:', room.id, room.room_name);
  return room;
}

/**
 * Get messages for a chat room
 */
export async function getChatMessages(
  roomId: number,
  limit: number = 100,
  beforeId?: number
): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (beforeId) {
    params.set('before_id', beforeId.toString());
  }

  const url = `${API_BASE}/chat/rooms/${roomId}/messages?${params.toString()}`;
  console.log('[Chat API] Fetching messages from:', url);
  
  const resp = await fetch(url, { headers: ngrokHeaders });

  if (!resp.ok) {
    const errorText = await resp.text();
    console.error('[Chat API] Failed to get messages:', resp.status, errorText);
    throw new Error(`Failed to get messages: ${resp.status}`);
  }

  const messages = await resp.json();
  console.log('[Chat API] Got', messages.length, 'messages for room', roomId);
  return messages;
}

/**
 * Send a message to a chat room
 */
export async function sendChatMessage(
  roomId: number,
  messageText: string
): Promise<SendMessageResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('You must be logged in to send messages. Please log out and log back in.');
  }

  console.log('[Chat API] Sending message with token:', token);

  const resp = await fetch(
    `${API_BASE}/chat/rooms/${roomId}/messages?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: {
        ...ngrokHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message_text: messageText }),
    }
  );

  if (!resp.ok) {
    const error = await resp.json().catch(() => ({ detail: 'Failed to send message' }));
    console.error('[Chat API] Send message error:', error);
    throw new Error(error.detail || 'Failed to send message');
  }

  return resp.json();
}

/**
 * Report a message
 */
export async function reportMessage(
  messageId: number,
  reportReason: string,
  reportDetails?: string
): Promise<{ success: boolean; message: string }> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('You must be logged in to report messages');
  }

  const resp = await fetch(
    `${API_BASE}/chat/messages/${messageId}/report?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: {
        ...ngrokHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message_id: messageId,
        report_reason: reportReason,
        report_details: reportDetails,
      }),
    }
  );

  if (!resp.ok) {
    throw new Error('Failed to report message');
  }

  return resp.json();
}
