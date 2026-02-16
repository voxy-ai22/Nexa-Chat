
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Safe destructuring to prevent "Cannot destructure property 'action' of 'undefined'"
    const body = req.body || {};
    const query = req.query || {};
    const { action, payload } = req.method === 'POST' ? body : query;
    
    if (!action) {
      return res.status(200).json({ status: 'READY', info: 'NEXA API ENDPOINT' });
    }

    // Ping must always succeed to prevent BOOT_ERROR
    if (action === 'ping') {
      return res.status(200).json({ 
        status: 'ONLINE', 
        version: '2.1.0-SECURE',
        timestamp: Date.now(),
        dbConfigured: !!process.env.DATABASE_URL
      });
    }

    // Handle Auth separately to ensure GMAIL_KEY/PASSWORD_KEY check
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
    const dbRequired = ['get_messages', 'send_message', 'get_tickets'];
    if (dbRequired.includes(action)) {
      if (!process.env.DATABASE_URL) {
        return res.status(503).json({ error: 'DB_NOT_CONFIGURED', message: 'Variabel DATABASE_URL belum diatur di server.' });
      }
      
      const sql = neon(process.env.DATABASE_URL);

      switch (action) {
        case 'get_messages':
          const messages = await sql`SELECT * FROM messages ORDER BY timestamp ASC LIMIT 50`;
          return res.status(200).json(messages);

        case 'send_message':
          const { message } = payload;
          await sql`INSERT INTO messages (id, userId, userName, userAvatar, text, timestamp, role) 
                    VALUES (${message.id}, ${message.userId}, ${message.userName}, ${message.userAvatar}, ${message.text}, ${message.timestamp}, ${message.role})`;
          return res.status(200).json({ success: true });

        case 'get_tickets':
          const tickets = await sql`SELECT * FROM tickets ORDER BY timestamp DESC`;
          return res.status(200).json(tickets);
      }
    }

    return res.status(400).json({ error: 'INVALID_ACTION', requested: action });

  } catch (error) {
    console.error('NEXA_API_INTERNAL_FAILURE:', error);
    return res.status(500).json({ 
      error: 'INTERNAL_SERVER_ERROR', 
      details: error.message 
    });
  }
}
