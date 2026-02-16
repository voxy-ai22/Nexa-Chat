
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_KEY);

  try {
    const { action, payload } = req.body || req.query;

    switch (action) {
      case 'ping':
        return res.status(200).json({ status: 'NEXA_ONLINE', timestamp: Date.now() });

      case 'auth':
        const { email, password } = payload;
        // Enkripsi Admin check via ENV
        const isAdmin = email === process.env.GMAIL_KEY && password === process.env.PASSWORD_KEY;
        
        if (isAdmin) {
          return res.status(200).json({
            user: { id: 'admin', name: 'CEO NEXA', role: 'admin', avatar: 'https://picsum.photos/seed/nexa-admin/200' }
          });
        }
        
        // Logika user biasa (simulasi registry di Neon)
        // const [user] = await sql`SELECT * FROM users WHERE email = ${email} AND password = ${password}`;
        return res.status(200).json({
          user: { id: 'user-' + Date.now(), name: email.split('@')[0].toUpperCase(), role: 'user', avatar: `https://picsum.photos/seed/${email}/200` }
        });

      case 'get_messages':
        const messages = await sql`SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100`;
        return res.status(200).json(messages.reverse());

      case 'send_message':
        const { message } = payload;
        await sql`INSERT INTO messages (id, userId, userName, userAvatar, text, timestamp, role) 
                  VALUES (${message.id}, ${message.userId}, ${message.userName}, ${message.userAvatar}, ${message.text}, ${message.timestamp}, ${message.role})`;
        return res.status(200).json({ success: true });

      default:
        return res.status(400).json({ error: 'INVALID_ACTION' });
    }
  } catch (error) {
    console.error('SERVER_ERROR:', error);
    return res.status(500).json({ error: 'CORE_DATABASE_FAILURE', detail: error.message });
  }
}
