import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionMode: 'websocket' | 'polling' | 'offline';
  typingUsers: { userId: number; username: string }[];
  joinPost: (postId: number) => void;
  leavePost: () => void;
  startTyping: () => void;
  stopTyping: () => void;
  emitNewComment: (postId: number, comment: any) => void;
  emitVoteUpdate: (postId: number, upvotes: number, downvotes: number) => void;
  setRefreshCallbacks: (callbacks: { comments?: () => void; votes?: () => void }) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'websocket' | 'polling' | 'offline'>('offline');
  const [typingUsers, setTypingUsers] = useState<{ userId: number; username: string }[]>([]);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [refreshCallbacks, setRefreshCallbacks] = useState<{ comments?: () => void; votes?: () => void }>({});
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection with production-friendly config
      const socketInstance = io({
        path: '/api/socketio',
        addTrailingSlash: false,
        transports: ['polling', 'websocket'], // Fallback to polling in production
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true,
        // Additional production settings
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
        setConnectionMode(socket?.io.engine.transport.name === 'websocket' ? 'websocket' : 'polling');
        setConnectionAttempts(0);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
        setIsConnected(false);
        setConnectionMode('offline');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        setConnectionMode('offline');
        setConnectionAttempts(prev => prev + 1);
        
        // After 3 failed attempts, fall back to polling mode
        if (connectionAttempts >= 3) {
          console.log('Falling back to polling mode');
          startPollingMode();
        }
      });

      // Listen for typing events
      socketInstance.on('typing-users', (users: { userId: number; username: string }[]) => {
        setTypingUsers(users);
      });

      socketInstance.on('user-typing', (user: { userId: number; username: string }) => {
        setTypingUsers(prev => {
          const exists = prev.find(u => u.userId === user.userId);
          if (!exists) {
            return [...prev, user];
          }
          return prev;
        });
      });

      socketInstance.on('user-stopped-typing', ({ userId }: { userId: number }) => {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user]);

  // Polling mode fallback
  const startPollingMode = () => {
    setConnectionMode('polling');
    if (!currentPostId) return;

    const interval = setInterval(() => {
      if (refreshCallbacks.comments) refreshCallbacks.comments();
      if (refreshCallbacks.votes) refreshCallbacks.votes();
    }, 3000);

    return () => clearInterval(interval);
  };

  const joinPost = (postId: number) => {
    if (socket && user) {
      socket.emit('join-post', {
        postId,
        userId: user.id,
        username: user.username
      });
      setCurrentPostId(postId);
      setTypingUsers([]); // Reset typing users when joining new post
    }
  };

  const leavePost = () => {
    setCurrentPostId(null);
    setTypingUsers([]);
  };

  const startTyping = () => {
    if (socket && currentPostId) {
      socket.emit('typing-start');
    }
  };

  const stopTyping = () => {
    if (socket && currentPostId) {
      socket.emit('typing-stop');
    }
  };

  const emitNewComment = (postId: number, comment: any) => {
    if (socket && user && connectionMode === 'websocket') {
      socket.emit('new-comment', {
        postId,
        comment,
        userId: user.id
      });
    } else if (connectionMode === 'polling') {
      // In polling mode, trigger refresh after a short delay
      setTimeout(() => {
        if (refreshCallbacks.comments) refreshCallbacks.comments();
      }, 500);
    }
  };

  const emitVoteUpdate = (postId: number, upvotes: number, downvotes: number) => {
    if (socket && connectionMode === 'websocket') {
      socket.emit('vote-update', {
        postId,
        upvotes,
        downvotes
      });
    } else if (connectionMode === 'polling') {
      // In polling mode, trigger refresh after a short delay
      setTimeout(() => {
        if (refreshCallbacks.votes) refreshCallbacks.votes();
      }, 500);
    }
  };

  const setRefreshCallbacksFunc = (callbacks: { comments?: () => void; votes?: () => void }) => {
    setRefreshCallbacks(callbacks);
  };

  const value: SocketContextType = {
    socket,
    isConnected: isConnected || connectionMode === 'polling',
    connectionMode,
    typingUsers,
    joinPost,
    leavePost,
    startTyping,
    stopTyping,
    emitNewComment,
    emitVoteUpdate,
    setRefreshCallbacks: setRefreshCallbacksFunc
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
