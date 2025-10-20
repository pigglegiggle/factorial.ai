'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/AuthContext';
import { useSocket } from '@/components/SocketContext';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  User, 
  Tag, 
  ArrowLeft,
  Send,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';
import Link from 'next/link';

interface ForumPost {
  id: number;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  username: string;
  result_json: {
    is_fake: boolean;
    confidence: number;
    explanation: string;
    tags: string[];
  };
  is_fake: boolean;
  confidence: number;
  news_content: string;
  tags: string[];
  user_vote?: 'upvote' | 'downvote' | null;
}

interface Comment {
  id: number;
  comment: string;
  created_at: string;
  username: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_comments: number;
  has_next: boolean;
  has_previous: boolean;
}

export default function ForumPostPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, token } = useAuth();
  const { 
    socket, 
    isConnected, 
    typingUsers, 
    joinPost, 
    leavePost, 
    startTyping, 
    stopTyping, 
    emitNewComment,
    emitVoteUpdate 
  } = useSocket();
  
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
      
      // Join the post room for real-time updates
      if (user && socket && isConnected) {
        joinPost(parseInt(id as string));
      }
    }
  }, [id, currentPage, user, socket, isConnected]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new comments
    const handleNewComment = (comment: Comment) => {
      setComments(prev => [comment, ...prev]);
      // Update pagination count
      setPagination(prev => prev ? {
        ...prev,
        total_comments: prev.total_comments + 1
      } : null);
    };

    // Listen for vote updates
    const handleVoteUpdate = ({ upvotes, downvotes }: { upvotes: number; downvotes: number }) => {
      setPost(prev => prev ? { ...prev, upvotes, downvotes } : null);
    };

    socket.on('comment-added', handleNewComment);
    socket.on('votes-updated', handleVoteUpdate);

    return () => {
      socket.off('comment-added', handleNewComment);
      socket.off('votes-updated', handleVoteUpdate);
    };
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leavePost();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const fetchPost = async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if user is logged in to get user vote status
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/forum?limit=50`, { headers });
      const data = await response.json();

      if (response.ok) {
        // Find the specific post
        const foundPost = data.posts.find((p: ForumPost) => p.id === parseInt(id as string));
        if (foundPost) {
          setPost(foundPost);
          // Set user vote if available
          if (foundPost.user_vote) {
            setUserVote(foundPost.user_vote);
          }
        } else {
          setError('Post not found');
        }
      } else {
        setError(data.error || 'Failed to load post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Network error. Please try again.');
    }
  };

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/forum/${id}/comments?page=${currentPage}&limit=10`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError(data.error || 'Failed to load comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user || !token) {
      setError('Please log in to vote');
      return;
    }

    if (isVoting) return; // Prevent double clicking

    setIsVoting(true);
    setError(null);

    // Store previous state for rollback on error
    const previousPost = post;
    const previousUserVote = userVote;

    try {
      // Optimistic update
      if (post) {
        const newPost = { ...post };
        let newUserVote: 'upvote' | 'downvote' | null = voteType;

        if (userVote === voteType) {
          // User is removing their vote
          newUserVote = null;
          if (voteType === 'upvote') {
            newPost.upvotes = Math.max(0, newPost.upvotes - 1);
          } else {
            newPost.downvotes = Math.max(0, newPost.downvotes - 1);
          }
        } else {
          // User is changing or adding vote
          if (userVote === 'upvote') {
            newPost.upvotes = Math.max(0, newPost.upvotes - 1);
          } else if (userVote === 'downvote') {
            newPost.downvotes = Math.max(0, newPost.downvotes - 1);
          }

          if (voteType === 'upvote') {
            newPost.upvotes += 1;
          } else {
            newPost.downvotes += 1;
          }
        }

        setPost(newPost);
        setUserVote(newUserVote);
      }

      // Make API call
      const response = await fetch(`/api/forum/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Rollback on error
        setPost(previousPost);
        setUserVote(previousUserVote);
        setError(data.error || 'Failed to vote');
      } else {
        // Update with actual server data
        if (data.action === 'removed') {
          setUserVote(null);
        } else {
          setUserVote(data.vote_type);
        }
        // Sync with server data and emit real-time update
        if (data.upvotes !== undefined && data.downvotes !== undefined) {
          setPost(prev => prev ? { ...prev, upvotes: data.upvotes, downvotes: data.downvotes } : null);
          // Emit real-time vote update to other users
          emitVoteUpdate(parseInt(id as string), data.upvotes, data.downvotes);
        }
      }
    } catch (error) {
      // Rollback on error
      setPost(previousPost);
      setUserVote(previousUserVote);
      console.error('Vote error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 3000);
  };

  const handleStopTyping = () => {
    setIsTyping(false);
    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      setError('Please log in to comment');
      return;
    }

    if (newComment.trim().length < 5) {
      setError('Comment must be at least 5 characters long');
      return;
    }

    setIsSubmittingComment(true);
    setError(null);

    try {
      const response = await fetch(`/api/forum/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: newComment.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        const newCommentData = data.comment;
        setNewComment('');
        handleStopTyping();
        
        // Add comment optimistically to local state
        setComments(prev => [newCommentData, ...prev]);
        setPagination(prev => prev ? {
          ...prev,
          total_comments: prev.total_comments + 1
        } : null);
        
        // Emit real-time update to other users
        emitNewComment(parseInt(id as string), newCommentData);
      } else {
        setError(data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getResultColor = (isFake: boolean) => {
    return isFake ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';
  };

  const getResultIcon = (isFake: boolean) => {
    return isFake ? (
      <AlertTriangle className="h-6 w-6 text-red-400" />
    ) : (
      <CheckCircle className="h-6 w-6 text-green-400" />
    );
  };

  if (isLoading && !post) {
    return (
      <div className="min-h-screen bg-[#111114] text-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-2 text-zinc-300">Loading post...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#111114] text-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-zinc-300 mb-2">Post not found</h2>
            <Link href="/forum" className="text-blue-400 hover:text-blue-300 underline">
              ← Back to Forum
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Back button and connection status */}
        <div className="mb-6 flex justify-between items-center">
          <Link 
            href="/forum"
            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Forum</span>
          </Link>
          
          {user && (
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-green-400">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs">Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-400">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs">Offline</span>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Post */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6 mb-8">
          {/* Post header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-zinc-400" />
              <span className="font-medium text-white">{post.username}</span>
              <span className="text-zinc-500">•</span>
              <div className="flex items-center space-x-1 text-zinc-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{formatDate(post.created_at)}</span>
              </div>
            </div>
          </div>

          {/* News analysis summary */}
          <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3 mb-4">
              {getResultIcon(post.is_fake)}
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  post.is_fake ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-green-400 bg-green-500/10 border border-green-500/20'
                }`}>
                  {post.is_fake ? 'Likely Fake' : 'Likely Real'} ({post.confidence}% confidence)
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-zinc-300 mb-2">News Content:</h4>
              <p className="text-zinc-300 bg-zinc-900/50 p-3 rounded border border-zinc-700">{post.news_content}</p>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-zinc-300 mb-2">AI Analysis:</h4>
              <p className="text-zinc-300">{post.result_json.explanation}</p>
            </div>
          
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs border border-blue-500/30"
                  >
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Post content */}
          <div className="mb-4">
            <h4 className="font-medium text-zinc-300 mb-2">Discussion:</h4>
            <p className="text-white leading-relaxed">{post.content}</p>
          </div>

          {/* Voting */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleVote('upvote')}
              disabled={!user || isVoting}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                userVote === 'upvote'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
              } disabled:text-zinc-600 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                isVoting ? 'opacity-50' : ''
              }`}
            >
              {isVoting && userVote !== 'downvote' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
              ) : (
                <ThumbsUp className={`h-5 w-5 ${userVote === 'upvote' ? 'fill-current' : ''}`} />
              )}
              <span className="font-medium">{post.upvotes}</span>
            </button>
            
            <button
              onClick={() => handleVote('downvote')}
              disabled={!user || isVoting}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                userVote === 'downvote'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
              } disabled:text-zinc-600 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                isVoting ? 'opacity-50' : ''
              }`}
            >
              {isVoting && userVote !== 'upvote' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
              ) : (
                <ThumbsDown className={`h-5 w-5 ${userVote === 'downvote' ? 'fill-current' : ''}`} />
              )}
              <span className="font-medium">{post.downvotes}</span>
            </button>

            <div className="flex items-center space-x-1 text-zinc-400">
              <MessageSquare className="h-5 w-5" />
              <span>{pagination?.total_comments || 0} comments</span>
            </div>
          </div>
        </div>

        {/* Add comment form */}
        {user ? (
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 p-6 mb-8">
            <h3 className="font-medium text-white mb-4">Add a Comment</h3>
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <textarea
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  if (e.target.value.length > 0) {
                    handleTyping();
                  } else {
                    handleStopTyping();
                  }
                }}
                onBlur={handleStopTyping}
                placeholder="Share your thoughts on this analysis..."
                rows={4}
                className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-400"
                disabled={isSubmittingComment}
              />
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="text-sm text-blue-400 animate-pulse">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].username} is typing...`
                    : typingUsers.length === 2
                    ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
                    : `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`
                  }
                </div>
              )}
              <div className="flex justify-between items-center">
                <p className="text-sm text-zinc-500">
                  {newComment.length}/5 characters minimum
                </p>
                <button
                  type="submit"
                  disabled={isSubmittingComment || newComment.trim().length < 5}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isSubmittingComment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Post Comment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
            <p className="text-blue-400">
              <Link href="/auth/login" className="text-blue-300 underline">Log in</Link> to join the discussion.
            </p>
          </div>
        )}

        {/* Comments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">
              Comments ({pagination?.total_comments || 0})
            </h3>
            {isConnected && (
              <div className="flex items-center space-x-1 text-green-400 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Real-time</span>
              </div>
            )}
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <>
              {comments.map((comment, index) => {
                const isNew = index === 0 && new Date(comment.created_at) > new Date(Date.now() - 5000);
                return (
                  <div 
                    key={comment.id} 
                    className={`bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-zinc-800 p-4 transition-all duration-300 ${
                      isNew ? 'animate-pulse border-blue-500/30 bg-blue-500/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-zinc-400" />
                        <span className="font-medium text-white">{comment.username}</span>
                        {isNew && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">New</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-zinc-500">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{formatDate(comment.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-zinc-300">{comment.comment}</p>
                  </div>
                );
              })}

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.has_previous}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <span className="text-zinc-300 bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.has_next}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
