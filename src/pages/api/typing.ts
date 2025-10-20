import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { sendToConnections } from './sse';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface User {
  id: number;
  username: string;
  email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as User;

    const { postId, action, username } = req.body;

    if (!postId || !action || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const messageType = action === 'start' ? 'user-typing' : 'user-stopped-typing';
    const message = {
      type: messageType,
      userId: decoded.id,
      username: decoded.username,
      postId
    };

    console.log(`User ${decoded.username} ${action} typing on post ${postId}`);

    // Broadcast to all connections in this post room
    sendToConnections(postId, message, decoded.id);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Typing API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
