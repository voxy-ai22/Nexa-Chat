
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Handle both JSON body and Query params
    let body = {};
    if (req.body) {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
    const query = req.query || {};
    const { action, payload } = req.method === 'POST' ? body : query;
    
    if (!action) {
      return res.status(200).json({ status: 'READY', info: 'NEXA API ENDPOINT' });
    }

    // Ping & Auto-Init Database Schema
    if (action === 'ping') {
      if (process.env.DATABASE_URL) {
        try {
          const sql = neon(process.env.DATABASE_URL);
          // Auto-create tables if missing
          await sql`
            CREATE TABLE IF NOT EXISTS messages (
              id TEXT PRIMARY KEY,
              userId TEXT,
              userName TEXT,
              userAvatar TEXT,
              text TEXT,
              timestamp BIGINT,
              role TEXT
            );
          `;
          await sql`
            CREATE TABLE IF NOT EXISTS tickets (
              id TEXT PRIMARY KEY,
              userId TEXT,
              userName TEXT,
              subject TEXT,
              status TEXT,
              timestamp BIGINT
            );
          `;
          await sql`
            CREATE TABLE IF NOT EXISTS suggestions (
              id TEXT PRIMARY KEY,
              userId TEXT,
              userName TEXT,
              userAvatar TEXT,
              content TEXT,
              timestamp BIGINT
            );
          `;
        } catch (dbErr) {
          console.error("DB_INIT_WARNING:", dbErr.message);
        }
      }

      return res.status(200).json({ 
        status: 'ONLINE', 
        version: '2.2.0-STABLE',
        timestamp: Date.now(),
        dbConfigured: !!process.env.DATABASE_URL
      });
    }

    // Handle Auth separately
    if (action === 'auth') {
      const { email, password } = payload || {};
      const isAdmin = email === process.env.GMAIL_KEY && password === process.env.PASSWORD_KEY;
      
      if (isAdmin) {
        return res.status(200).json({
          user: { id: 'admin-01', name: 'NEXA CEO', role: 'admin', avatar: 'https://picsum.photos/seed/nexa-ceo/200', email }
        });
      }
      
      return res.status(200).json({
        user: { 
          id: `u-${Buffer.from(email || 'anon').toString('hex').slice(0, 8)}`, 
          name: (email || 'user').split('@')[0].toUpperCase(), 
          role: 'user', 
          avatar: `https://picsum.photos/seed/${email}/200`,
          email: email || ''
        }
      });
    }

    // Database Actions
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'DB_NOT_CONFIGURED', message: 'DATABASE_URL environment variable is missing.' });
    }
    
    const sql = neon(process.env.DATABASE_URL);

    switch (action) {
      case 'get_messages':
        const messages = await sql`SELECT * FROM messages ORDER BY timestamp ASC LIMIT 100`;
        return res.status(200).json(messages);

      case 'send_message': {
        const { message } = payload || {};
        if (!message) return res.status(400).json({ error: 'MISSING_MESSAGE_PAYLOAD' });
        
        await sql`
          INSERT INTO messages (id, userId, userName, userAvatar, text, timestamp, role) 
          VALUES (${message.id}, ${message.userId}, ${message.userName}, ${message.userAvatar}, ${message.text}, ${message.timestamp}, ${message.role})
          ON CONFLICT (id) DO NOTHING
        `;
        return res.status(200).json({ success: true });
      }

      case 'get_tickets':
        const tickets = await sql`SELECT * FROM tickets ORDER BY timestamp DESC`;
        return res.status(200).json(tickets);
        
      case 'send_ticket': {
        const { ticket } = payload || {};
        await sql`
          INSERT INTO tickets (id, userId, userName, subject, status, timestamp)
          VALUES (${ticket.id}, ${ticket.userId}, ${ticket.userName}, ${ticket.subject}, ${ticket.status}, ${ticket.timestamp})
        `;
        return res.status(200).json({ success: true });
      }

      case 'get_suggestions':
        const suggestions = await sql`SELECT * FROM suggestions ORDER BY timestamp DESC`;
        return res.status(200).json(suggestions);

      case 'send_suggestion': {
        const { suggestion } = payload || {};
        await sql`
          INSERT INTO suggestions (id, userId, userName, userAvatar, content, timestamp)
          VALUES (${suggestion.id}, ${suggestion.userId}, ${suggestion.userName}, ${suggestion.userAvatar}, ${suggestion.content}, ${suggestion.timestamp})
        `;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ error: 'INVALID_ACTION', requested: action });
    }

  } catch (error) {
    console.error('NEXA_API_CORE_ERROR:', error);
    return res.status(500).json({ 
      error: 'INTERNAL_SERVER_ERROR', 
      details: error.message 
    });
  }
}
