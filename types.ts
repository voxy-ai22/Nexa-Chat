
export enum View {
  CHAT = 'chat',
  TICKET = 'ticket',
  SARAN = 'saran',
  PROFILE = 'profile'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
  email: string;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  imageUrl?: string;
  stickerUrl?: string; // Properti baru untuk stiker
  timestamp: number;
  role: 'user' | 'admin' | 'bot';
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  status: 'open' | 'closed';
  timestamp: number;
}

export interface Suggestion {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'alert';
}
