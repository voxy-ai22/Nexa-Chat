
import { Message, User, Ticket, Suggestion } from '../types';

const STORAGE_KEY = 'nexa_global_db';

interface Database {
  users: Record<string, { id: string; password: string }>;
  messages: Message[];
  tickets: Ticket[];
  suggestions: Suggestion[];
  favoriteStickers: string[]; // Daftar URL stiker favorit
  lastReset: string; 
}

const getInitialDB = (): Database => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return {
    users: {},
    messages: [],
    tickets: [],
    suggestions: [],
    favoriteStickers: [],
    lastReset: new Date().toISOString()
  };
};

export const saveToDB = (data: Partial<Database>) => {
  const current = getInitialDB();
  const updated = { ...current, ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getDB = (): Database => {
  const db = getInitialDB();
  const now = new Date();
  
  const lastResetDate = new Date(db.lastReset);
  const resetPoint = new Date();
  resetPoint.setHours(7, 0, 0, 0);

  if (now >= resetPoint && (lastResetDate < resetPoint)) {
    db.messages = [];
    db.lastReset = new Date().toISOString();
    saveToDB(db);
  }
  
  return db;
};

export const toggleFavoriteSticker = (url: string) => {
  const db = getDB();
  let favorites = db.favoriteStickers || [];
  if (favorites.includes(url)) {
    favorites = favorites.filter(s => s !== url);
  } else {
    favorites = [...favorites, url];
  }
  saveToDB({ favoriteStickers: favorites });
  return favorites;
};

export const chatChannel = new BroadcastChannel('nexa_chat_sync');

export const broadcastMessage = (message: Message) => {
  chatChannel.postMessage({ type: 'NEW_MESSAGE', payload: message });
};
