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
      // Check environment settings
      const isProduction = process.env.NODE_ENV === 'production';
      const forcePolling = process.env.NEXT_PUBLIC_FORCE_POLLING === 'true';
      const websocketDisabled = process.env.NEXT_PUBLIC_WEBSOCKET_DISABLED === 'true';
      
      // If WebSocket is disabled, go straight to polling mode
      if (websocketDisabled || (isProduction && forcePolling)) {
        console.log('WebSocket disabled, starting in polling mode');
        startPollingMode();
        return;
      }
      
      // Initialize socket connection with production-safe config
      const socketInstance = io({
        path: '/api/socketio',
        addTrailingSlash: false,
        // In production, force polling only to avoid WebSocket issues
        transports: isProduction ? ['polling'] : ['polling', 'websocket'],
        upgrade: !isProduction, // Only allow upgrade to WebSocket in development
        rememberUpgrade: false,
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        // Force polling in production
        forceBase64: isProduction,
      });

      socketInstance.on('connect', () => {
        console.log('Connected to Socket.IO');
        setIsConnected(true);
        // In production, we're always using polling
        const transport = isProduction ? 'polling' : (socketInstance.io.engine?.transport?.name || 'polling');
        setConnectionMode(transport === 'websocket' ? 'websocket' : 'polling');
        setConnectionAttempts(0);
        console.log(`Connection mode: ${transport}`);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from Socket.IO');
        setIsConnected(false);
        setConnectionMode('offline');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        setConnectionMode('offline');
        setConnectionAttempts(prev => prev + 1);
        
        // After 3 failed attempts, start manual polling
        if (connectionAttempts >= 2) {
          console.log('Socket.IO failed, switching to manual polling mode');
          socketInstance.disconnect();
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
        // Clean up polling interval if it exists
        if ((window as any).pollingInterval) {
          clearInterval((window as any).pollingInterval);
        }
      };
    }
  }, [user]);

  // Enhanced polling mode fallback
  const startPollingMode = () => {
    console.log('Starting manual polling mode');
    setConnectionMode('polling');
    setIsConnected(true); // Show as connected in polling mode
    
    if (!currentPostId) return;

    // More frequent polling for better UX
    const interval = setInterval(() => {
      if (refreshCallbacks.comments) {
        console.log('Polling: refreshing comments');
        refreshCallbacks.comments();
      }
      if (refreshCallbacks.votes) {
        console.log('Polling: refreshing votes');
        refreshCallbacks.votes();
      }
    }, 2000); // Every 2 seconds instead of 3

    // Store interval for cleanup
    (window as any).pollingInterval = interval;

    return () => {
      if ((window as any).pollingInterval) {
        clearInterval((window as any).pollingInterval);
      }
    };
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
