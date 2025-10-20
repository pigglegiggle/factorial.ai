import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';

// Store active connections
const connections = new Map<string, { res: NextApiResponse; userId: number; postId?: number }>();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postId, token } = req.query;

  // Verify authentication from query parameter
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = verifyToken(token as string);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Generate unique connection ID
  const connectionId = `${user.id}_${Date.now()}_${Math.random()}`;
  
  // Store connection
  connections.set(connectionId, { 
    res, 
    userId: user.id, 
    postId: postId ? parseInt(postId as string) : undefined 
  });

  console.log(`SSE: User ${user.username} connected for post ${postId} (${connectionId})`);

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    userId: user.id,
    connectionId,
    message: 'Real-time connection established' 
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`SSE: User ${user.username} disconnected (${connectionId})`);
    connections.delete(connectionId);
  });

  // Keep connection alive with heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (connections.has(connectionId)) {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);

  // Clean up on connection close
  req.on('close', () => {
    clearInterval(heartbeat);
    connections.delete(connectionId);
  });
}

// Function to send message to specific connections
export function sendToConnections(postId: number, message: any, excludeUserId?: number) {
  const data = `data: ${JSON.stringify(message)}\n\n`;
  
  for (const [connectionId, connection] of connections) {
    if (connection.postId === postId && 
        connection.userId !== excludeUserId &&
        !connection.res.destroyed) {
      try {
        connection.res.write(data);
      } catch (error) {
        console.error(`Failed to send to connection ${connectionId}:`, error);
        connections.delete(connectionId);
      }
    }
  }
}

// Function to broadcast to all connections in a post
export function broadcastToPost(postId: number, message: any) {
  sendToConnections(postId, message);
}

// Export function to get connection count
export function getConnectionCount(postId?: number): number {
  if (postId) {
    return Array.from(connections.values()).filter(conn => conn.postId === postId).length;
  }
  return connections.size;
}
