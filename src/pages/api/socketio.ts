import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface SocketUser {
  userId: number;
  username: string;
  postId?: number;
}

interface TypingUser {
  userId: number;
  username: string;
  timestamp: number;
}

// Store typing users per post
const typingUsers = new Map<number, Map<number, TypingUser>>();
// Store socket to user mapping
const socketUsers = new Map<string, SocketUser>();

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  const socket = res.socket as any;
  
  if (socket.server.io) {
    console.log('Socket.IO is already running');
  } else {
    console.log('Socket.IO is initializing');
    const isProduction = process.env.NODE_ENV === 'production';
    
    const io = new SocketIOServer(socket.server as any, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: isProduction 
          ? ['https://factorial-ai.sinpw.site', 'https://www.factorial-ai.sinpw.site']
          : "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      // Force polling in production to avoid WebSocket issues
      transports: isProduction ? ['polling'] : ['polling', 'websocket'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      // Additional production settings
      maxHttpBufferSize: 1e6,
      allowRequest: (req, callback) => {
        // Simple security check
        callback(null, true);
      }
    });
    
    socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join a forum post room
      socket.on('join-post', (data: { postId: number; userId: number; username: string }) => {
        const { postId, userId, username } = data;
        
        // Leave previous room if any
        const previousUser = socketUsers.get(socket.id);
        if (previousUser?.postId) {
          socket.leave(`post-${previousUser.postId}`);
        }

        // Join new room
        socket.join(`post-${postId}`);
        socketUsers.set(socket.id, { userId, username, postId });
        
        console.log(`User ${username} joined post ${postId}`);
        
        // Send current typing users to the new joiner
        const currentTypingUsers = typingUsers.get(postId);
        if (currentTypingUsers && currentTypingUsers.size > 0) {
          const typingArray = Array.from(currentTypingUsers.values())
            .filter(user => user.userId !== userId)
            .map(user => ({ userId: user.userId, username: user.username }));
          
          socket.emit('typing-users', typingArray);
        }
      });

      // Handle typing start
      socket.on('typing-start', () => {
        const user = socketUsers.get(socket.id);
        if (!user || !user.postId) return;

        if (!typingUsers.has(user.postId)) {
          typingUsers.set(user.postId, new Map());
        }

        const postTypingUsers = typingUsers.get(user.postId)!;
        postTypingUsers.set(user.userId, {
          userId: user.userId,
          username: user.username,
          timestamp: Date.now()
        });

        // Broadcast to others in the same post
        socket.to(`post-${user.postId}`).emit('user-typing', {
          userId: user.userId,
          username: user.username
        });
      });

      // Handle typing stop
      socket.on('typing-stop', () => {
        const user = socketUsers.get(socket.id);
        if (!user || !user.postId) return;

        const postTypingUsers = typingUsers.get(user.postId);
        if (postTypingUsers) {
          postTypingUsers.delete(user.userId);
          
          // Broadcast to others in the same post
          socket.to(`post-${user.postId}`).emit('user-stopped-typing', {
            userId: user.userId
          });
        }
      });

      // Handle new comments
      socket.on('new-comment', (data: { 
        postId: number; 
        comment: any;
        userId: number;
      }) => {
        const { postId, comment, userId } = data;
        
        // Broadcast new comment to all users in the post EXCEPT the sender
        socket.to(`post-${postId}`).emit('comment-added', comment);
        
        // Remove user from typing list
        const postTypingUsers = typingUsers.get(postId);
        if (postTypingUsers) {
          postTypingUsers.delete(userId);
          socket.to(`post-${postId}`).emit('user-stopped-typing', { userId });
        }
      });

      // Handle vote updates
      socket.on('vote-update', (data: {
        postId: number;
        upvotes: number;
        downvotes: number;
      }) => {
        // Broadcast vote update to all users in the post EXCEPT the sender
        socket.to(`post-${data.postId}`).emit('votes-updated', {
          upvotes: data.upvotes,
          downvotes: data.downvotes
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        const user = socketUsers.get(socket.id);
        if (user && user.postId) {
          // Remove from typing users
          const postTypingUsers = typingUsers.get(user.postId);
          if (postTypingUsers) {
            postTypingUsers.delete(user.userId);
            socket.to(`post-${user.postId}`).emit('user-stopped-typing', {
              userId: user.userId
            });
          }
        }
        
        socketUsers.delete(socket.id);
      });
    });

    // Clean up old typing indicators every 10 seconds
    setInterval(() => {
      const now = Date.now();
      typingUsers.forEach((postUsers, postId) => {
        postUsers.forEach((user, userId) => {
          if (now - user.timestamp > 10000) { // 10 seconds timeout
            postUsers.delete(userId);
            io.to(`post-${postId}`).emit('user-stopped-typing', { userId });
          }
        });
      });
    }, 10000);
  }
  
  res.end();
};

export default SocketHandler;
