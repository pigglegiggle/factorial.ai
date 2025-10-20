import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface PollingContextType {
  typingUsers: { userId: number; username: string }[];
  joinPost: (postId: number) => void;
  leavePost: () => void;
  startTyping: () => void;
  stopTyping: () => void;
  emitNewComment: (postId: number, comment: any) => void;
  emitVoteUpdate: (postId: number, upvotes: number, downvotes: number) => void;
  refreshComments?: () => void;
  refreshVotes?: () => void;
}

const PollingContext = createContext<PollingContextType | undefined>(undefined);

export const usePolling = () => {
  const context = useContext(PollingContext);
  if (!context) {
    throw new Error('usePolling must be used within a PollingProvider');
  }
  return context;
};

export const PollingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [typingUsers, setTypingUsers] = useState<{ userId: number; username: string }[]>([]);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [refreshCallbacks, setRefreshCallbacks] = useState<{
    comments?: () => void;
    votes?: () => void;
  }>({});
  const { user, token } = useAuth();

  // Polling for updates every 3 seconds (fallback when WebSocket fails)
  useEffect(() => {
    if (!currentPostId) return;

    const interval = setInterval(() => {
      // Refresh comments and votes periodically
      if (refreshCallbacks.comments) refreshCallbacks.comments();
      if (refreshCallbacks.votes) refreshCallbacks.votes();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPostId, refreshCallbacks]);

  const joinPost = (postId: number) => {
    setCurrentPostId(postId);
    setTypingUsers([]);
  };

  const leavePost = () => {
    setCurrentPostId(null);
    setTypingUsers([]);
  };

  const startTyping = () => {
    // In polling mode, we can't show real-time typing
    // This is a limitation of the fallback
  };

  const stopTyping = () => {
    // In polling mode, we can't show real-time typing
  };

  const emitNewComment = (postId: number, comment: any) => {
    // Trigger immediate refresh for better UX
    setTimeout(() => {
      if (refreshCallbacks.comments) refreshCallbacks.comments();
    }, 500);
  };

  const emitVoteUpdate = (postId: number, upvotes: number, downvotes: number) => {
    // Trigger immediate refresh for better UX
    setTimeout(() => {
      if (refreshCallbacks.votes) refreshCallbacks.votes();
    }, 500);
  };

  const setRefreshComments = (callback: () => void) => {
    setRefreshCallbacks(prev => ({ ...prev, comments: callback }));
  };

  const setRefreshVotes = (callback: () => void) => {
    setRefreshCallbacks(prev => ({ ...prev, votes: callback }));
  };

  const value: PollingContextType = {
    typingUsers,
    joinPost,
    leavePost,
    startTyping,
    stopTyping,
    emitNewComment,
    emitVoteUpdate,
    refreshComments: refreshCallbacks.comments,
    refreshVotes: refreshCallbacks.votes
  };

  return (
    <PollingContext.Provider value={value}>
      {children}
    </PollingContext.Provider>
  );
};
