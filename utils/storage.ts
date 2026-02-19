
import { Message, User, Ticket, Suggestion } from '../types';

const STORAGE_KEY = 'nexa_global_db';

interface Database {
  users: Record<string, { id: string; password: string }>;
  messages: Message[];
  tickets: Ticket[];
  suggestions: Suggestion[];
  favoriteStickers: string[];
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
  
  // LOGIKA RESET 07:00 PAGI
  const lastResetDate = new Date(db.lastReset);
  
  // Tentukan waktu reset hari ini (07:00 AM)
  const todayResetPoint = new Date();
  todayResetPoint.setHours(7, 0, 0, 0);

  // Jika SEKARANG sudah lewat jam 7 pagi
  // DAN terakhir reset adalah SEBELUM jam 7 pagi hari ini
  if (now >= todayResetPoint && lastResetDate < todayResetPoint) {
    console.log("NEXA_SYSTEM: PROTOKOL PEMBERSIHAN 07:00 DIAKTIFKAN.");
    db.messages = [];
    db.lastReset = now.toISOString();
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
