import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  typingUsers: { userId: number; username: string }[];
  joinPost: (postId: number) => void;
  leavePost: () => void;
  startTyping: () => void;
  stopTyping: () => void;
  emitNewComment: (postId: number, comment: any) => void;
  emitVoteUpdate: (postId: number, upvotes: number, downvotes: number) => void;
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
  const [typingUsers, setTypingUsers] = useState<{ userId: number; username: string }[]>([]);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const socketInstance = io({
        path: '/api/socketio',
        addTrailingSlash: false,
      });

      socketInstance.on('connect', () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
        setIsConnected(false);
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
    if (socket && user) {
      socket.emit('new-comment', {
        postId,
        comment,
        userId: user.id
      });
    }
  };

  const emitVoteUpdate = (postId: number, upvotes: number, downvotes: number) => {
    if (socket) {
      socket.emit('vote-update', {
        postId,
        upvotes,
        downvotes
      });
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    typingUsers,
    joinPost,
    leavePost,
    startTyping,
    stopTyping,
    emitNewComment,
    emitVoteUpdate
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
