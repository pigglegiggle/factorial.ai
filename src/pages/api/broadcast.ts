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

    const { type, postId, comment, upvotes, downvotes, excludeUserId } = req.body;

    if (!type || !postId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let message: any = { type, postId };

    switch (type) {
      case 'comment-added':
        if (!comment) {
          return res.status(400).json({ error: 'Comment data required' });
        }
        message.comment = comment;
        break;
      
      case 'vote-updated':
        if (upvotes === undefined || downvotes === undefined) {
          return res.status(400).json({ error: 'Vote counts required' });
        }
        message.upvotes = upvotes;
        message.downvotes = downvotes;
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid message type' });
    }

    console.log(`Broadcasting ${type} to post ${postId}`);

    // Broadcast to all connections in this post room
    sendToConnections(postId, message, excludeUserId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Broadcast API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
