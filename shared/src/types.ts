// Shared types for Mashed

export interface User {
  id: string;
  username: string;
  connectedAt: Date;
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
}

export interface ServerMessage {
  type: 'user_joined' | 'user_left' | 'message' | 'error';
  payload: unknown;
}

export interface ClientMessage {
  type: 'join' | 'leave' | 'send_message';
  payload: unknown;
}
