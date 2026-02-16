
import { Message, User, Ticket, Suggestion } from '../types';

const STORAGE_KEY = 'nexa_global_db';

interface Database {
  users: Record<string, { id: string; password: string }>;
  messages: Message[];
  tickets: Ticket[];
  suggestions: Suggestion[];
  lastReset: string; // ISO Date of last reset
}

const getInitialDB = (): Database => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return {
    users: {},
    messages: [],
    tickets: [],
    suggestions: [],
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
  
  // Check for 07:00 AM reset
  const lastResetDate = new Date(db.lastReset);
  const resetPoint = new Date();
  resetPoint.setHours(7, 0, 0, 0);

  // If we haven't reset today and it's past 7 AM, OR if last reset was yesterday
  if (now >= resetPoint && (lastResetDate < resetPoint)) {
    db.messages = [];
    db.lastReset = new Date().toISOString();
    saveToDB(db);
  }
  
  return db;
};

// Simple BroadcastChannel for simulated real-time online count across tabs
export const onlineChannel = new BroadcastChannel('nexa_online_nodes');
