import { useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

interface SSEContextType {
  isConnected: boolean;
  connectionMode: 'sse' | 'offline';
  typingUsers: { userId: number; username: string }[];
  joinPost: (postId: number) => void;
  leavePost: () => void;
  startTyping: () => void;
  stopTyping: () => void;
  emitNewComment: (postId: number, comment: any) => void;
  emitVoteUpdate: (postId: number, upvotes: number, downvotes: number) => void;
  onCommentAdded: (callback: (comment: any) => void) => void;
  onVoteUpdated: (callback: (votes: { upvotes: number; downvotes: number }) => void) => void;
}

export function useSSE(): SSEContextType {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode] = useState<'sse' | 'offline'>('sse');
  const [typingUsers, setTypingUsers] = useState<{ userId: number; username: string }[]>([]);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const commentCallbackRef = useRef<((comment: any) => void) | null>(null);
  const voteCallbackRef = useRef<((votes: { upvotes: number; downvotes: number }) => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user, token } = useAuth();

  const joinPost = (postId: number) => {
    if (!user || !token) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setCurrentPostId(postId);
    setTypingUsers([]);

    // Create new SSE connection
    const eventSource = new EventSource(
      `/api/sse?postId=${postId}&token=${encodeURIComponent(token)}`
    );

    eventSource.onopen = () => {
      console.log('SSE: Connected to real-time updates');
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE: Received data:', data);

        switch (data.type) {
          case 'connected':
            console.log('SSE: Connection confirmed');
            break;
          
          case 'comment-added':
            if (commentCallbackRef.current) {
              commentCallbackRef.current(data.comment);
            }
            break;
          
          case 'vote-updated':
            if (voteCallbackRef.current) {
              voteCallbackRef.current({ upvotes: data.upvotes, downvotes: data.downvotes });
            }
            break;
          
          case 'user-typing':
            setTypingUsers(prev => {
              const exists = prev.find(u => u.userId === data.userId);
              if (!exists) {
                return [...prev, { userId: data.userId, username: data.username }];
              }
              return prev;
            });
            break;
          
          case 'user-stopped-typing':
            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
            break;
          
          case 'heartbeat':
            // Keep connection alive
            break;
        }
      } catch (error) {
        console.error('SSE: Error parsing message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE: Connection error:', error);
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (currentPostId) {
          joinPost(currentPostId);
        }
      }, 3000);
    };

    eventSourceRef.current = eventSource;
  };

  const leavePost = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setCurrentPostId(null);
    setTypingUsers([]);
    setIsConnected(false);
  };

  const startTyping = () => {
    if (!currentPostId || !user) return;

    // Send typing notification via API
    fetch('/api/typing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        postId: currentPostId,
        action: 'start',
        username: user.username
      })
    }).catch(console.error);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (!currentPostId || !user) return;

    // Send stop typing notification via API
    fetch('/api/typing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        postId: currentPostId,
        action: 'stop',
        username: user.username
      })
    }).catch(console.error);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const emitNewComment = (postId: number, comment: any) => {
    // Send via API to broadcast to SSE connections
    fetch('/api/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'comment-added',
        postId,
        comment,
        excludeUserId: user?.id
      })
    }).catch(console.error);
  };

  const emitVoteUpdate = (postId: number, upvotes: number, downvotes: number) => {
    // Send via API to broadcast to SSE connections
    fetch('/api/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'vote-updated',
        postId,
        upvotes,
        downvotes,
        excludeUserId: user?.id
      })
    }).catch(console.error);
  };

  const onCommentAdded = (callback: (comment: any) => void) => {
    commentCallbackRef.current = callback;
  };

  const onVoteUpdated = (callback: (votes: { upvotes: number; downvotes: number }) => void) => {
    voteCallbackRef.current = callback;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leavePost();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionMode,
    typingUsers,
    joinPost,
    leavePost,
    startTyping,
    stopTyping,
    emitNewComment,
    emitVoteUpdate,
    onCommentAdded,
    onVoteUpdated
  };
}
