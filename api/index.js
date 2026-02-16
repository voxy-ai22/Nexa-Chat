
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // CORS Configuration - Harus di awal
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { action, payload } = req.method === 'POST' ? req.body : req.query;
    
    if (!action) {
      return res.status(400).json({ error: 'ACTION_REQUIRED' });
    }

    // Ping adalah pemeriksaan kesehatan dasar, tidak butuh DB
    if (action === 'ping') {
      return res.status(200).json({ 
        status: 'ONLINE', 
        version: '2.0.3-STABLE',
        timestamp: Date.now()
      });
    }

    // Koneksi DB hanya jika diperlukan
    const dbRequired = ['get_messages', 'send_message', 'get_tickets', 'send_ticket', 'auth'];
    let sql;
    if (dbRequired.includes(action)) {
      if (!process.env.DATABASE_URL) {
        console.error("CRITICAL: DATABASE_URL is missing in environment variables.");
        return res.status(500).json({ error: 'DATABASE_CONFIGURATION_MISSING' });
      }
      sql = neon(process.env.DATABASE_URL);
    }

    switch (action) {
      case 'auth': {
        if (!payload) return res.status(400).json({ error: 'PAYLOAD_MISSING' });
        const { email, password } = payload;
        const isAdmin = email === process.env.GMAIL_KEY && password === process.env.PASSWORD_KEY;
        
        if (isAdmin) {
          return res.status(200).json({
            user: { id: 'admin-01', name: 'NEXA CEO', role: 'admin', avatar: 'https://picsum.photos/seed/nexa-ceo/200', email }
          });
        }
        
        return res.status(200).json({
          user: { 
            id: `u-${Buffer.from(email || 'anonymous').toString('hex').slice(0, 8)}`, 
            name: (email || 'user').split('@')[0].toUpperCase(), 
            role: 'user', 
            avatar: `https://picsum.photos/seed/${email}/200`,
            email: email || ''
          }
        });
      }

      case 'get_messages': {
        const messages = await sql`SELECT * FROM messages ORDER BY timestamp ASC LIMIT 100`;
        return res.status(200).json(messages);
      }

      case 'send_message': {
        if (!payload || !payload.message) return res.status(400).json({ error: 'MESSAGE_PAYLOAD_MISSING' });
        const { message } = payload;
        await sql`INSERT INTO messages (id, userId, userName, userAvatar, text, timestamp, role) 
                  VALUES (${message.id}, ${message.userId}, ${message.userName}, ${message.userAvatar}, ${message.text}, ${message.timestamp}, ${message.role})`;
        return res.status(200).json({ success: true });
      }

      case 'get_tickets': {
        const tickets = await sql`SELECT * FROM tickets ORDER BY timestamp DESC`;
        return res.status(200).json(tickets);
      }

      default:
        return res.status(400).json({ error: 'UNKNOWN_ACTION', requested: action });
    }
  } catch (error) {
    console.error('API_CRITICAL_ERROR:', error);
    return res.status(500).json({ 
      error: 'SYSTEM_FAILURE', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
