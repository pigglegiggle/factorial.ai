'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/AuthContext';
import ForumFeedbackForm from '@/components/ForumFeedbackForm';
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
  const [typingUsers, setTypingUsers] = useState<{ userId: number; username: string }[]>([]);
  const [newlyAddedCommentIds, setNewlyAddedCommentIds] = useState<Set<number>>(new Set());
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
      
      // Start polling for updates every 2 seconds
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      pollingIntervalRef.current = setInterval(() => {
        // Refresh data periodically for real-time feel
        fetchPost();
        fetchComments();
      }, 2000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [id, currentPage, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
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
        // Sync with server data (broadcasting is handled by the API)
        if (data.upvotes !== undefined && data.downvotes !== undefined) {
          setPost(prev => prev ? { ...prev, upvotes: data.upvotes, downvotes: data.downvotes } : null);
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
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const handleStopTyping = () => {
    setIsTyping(false);
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
        
        // Track this as a newly added comment
        setNewlyAddedCommentIds(prev => new Set(prev).add(newCommentData.id));
        
        // Remove from newly added after 30 seconds
        setTimeout(() => {
          setNewlyAddedCommentIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(newCommentData.id);
            return newSet;
          });
        }, 30000);
        
        // Broadcasting is handled automatically by the API
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
    const now = new Date();
    
    // Add 7 hours to comment time to convert UTC to Bangkok time
    const bangkokCommentTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    
    // Calculate time difference
    const diffMs = now.getTime() - bangkokCommentTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Show relative time in English for recent comments
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      // For older posts, show Bangkok time in English
      return date.toLocaleDateString('en-US', { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + ' ' + date.toLocaleTimeString('en-US', { 
        timeZone: 'Asia/Bangkok',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
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
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="flex justify-center items-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-green-500/20 border-t-green-400 mx-auto"></div>
              <p className="text-zinc-400 text-lg">Loading discussion...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#111114] text-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-6">
            <div className="p-8 bg-zinc-800/30 rounded-2xl border border-zinc-700 max-w-2xl mx-auto">
              <MessageSquare className="h-16 w-16 text-zinc-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-zinc-300 mb-4">Discussion Not Found</h2>
              <p className="text-zinc-500 mb-6">This discussion may have been removed or doesn't exist.</p>
              <Link 
                href="/forum" 
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Forum</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111114] text-white">
      {/* Modern Header */}
      <div className="border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <Link 
              href="/forum"
              className="flex items-center space-x-3 text-blue-400 hover:text-blue-300 transition-colors group"
            >
              <div className="p-2 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg">Back to Forum</span>
            </Link>
            
            {user && (
              <div className="flex items-center space-x-3 bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="flex items-center space-x-2 text-green-400">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium">Live Updates</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">{/* Content will continue below */}

        {error && (
          <div className="bg-zinc-800/50 border border-red-500/20 rounded-2xl p-8 mb-12 shadow-xl">
            <div className="text-center space-y-3">
              <div className="p-3 bg-red-500/20 rounded-2xl w-fit mx-auto">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Enhanced Post */}
        <article className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-8 mb-12 shadow-xl">
          {/* Post header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <span className="font-semibold text-white text-lg">{post.username}</span>
                <div className="flex items-center space-x-2 text-zinc-400 text-sm mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced News analysis summary */}
          <div className="bg-zinc-700/30 rounded-2xl p-6 mb-6 border border-zinc-600/30">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
                {getResultIcon(post.is_fake)}
              </div>
              <div>
                <div className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${
                  post.is_fake 
                    ? 'text-red-300 bg-red-500/20 border-red-500/30' 
                    : 'text-green-300 bg-green-500/20 border-green-500/30'
                }`}>
                  {post.is_fake ? 'Likely Fake' : 'Likely Real'} ({post.confidence}% confidence)
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Original Content:</span>
                </h4>
                <p className="text-zinc-200 leading-relaxed bg-zinc-700/30 p-4 rounded-lg border border-zinc-600/30">{post.news_content}</p>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>AI Analysis:</span>
                </h4>
                <p className="text-zinc-200 leading-relaxed bg-zinc-700/30 p-4 rounded-lg border border-zinc-600/30">{post.result_json.explanation}</p>
              </div>
            
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-lg text-sm font-medium border border-blue-500/30"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Post content */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Community Discussion:</span>
            </h4>
            <div className="text-zinc-200 leading-relaxed text-lg bg-zinc-700/20 rounded-xl p-6 border border-zinc-600/20">
              {post.content}
            </div>
          </div>

          {/* Enhanced Voting */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-600/30">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleVote('upvote')}
                disabled={!user || isVoting}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  userVote === 'upvote'
                    ? 'bg-green-500/20 text-green-300 border-2 border-green-500/40 shadow-green-500/20 shadow-lg'
                    : 'text-green-400 hover:text-green-300 hover:bg-green-500/10 border-2 border-transparent hover:border-green-500/20'
                } disabled:text-zinc-600 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                  isVoting ? 'opacity-50' : ''
                }`}
              >
                {isVoting && userVote !== 'downvote' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
                ) : (
                  <ThumbsUp className={`h-5 w-5 ${userVote === 'upvote' ? 'fill-current' : ''}`} />
                )}
                <span>{post.upvotes}</span>
              </button>
              
              <button
                onClick={() => handleVote('downvote')}
                disabled={!user || isVoting}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  userVote === 'downvote'
                    ? 'bg-red-500/20 text-red-300 border-2 border-red-500/40 shadow-red-500/20 shadow-lg'
                    : 'text-red-400 hover:text-red-300 hover:bg-red-500/10 border-2 border-transparent hover:border-red-500/20'
                } disabled:text-zinc-600 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                  isVoting ? 'opacity-50' : ''
                }`}
              >
                {isVoting && userVote !== 'upvote' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
                ) : (
                  <ThumbsDown className={`h-5 w-5 ${userVote === 'downvote' ? 'fill-current' : ''}`} />
                )}
                <span>{post.downvotes}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 bg-zinc-700/30 px-4 py-2 rounded-xl border border-zinc-600/30">
              <MessageSquare className="h-5 w-5 text-zinc-400" />
              <span className="text-zinc-300 font-medium">{pagination?.total_comments || 0} comments</span>
            </div>
          </div>
        </article>

        {/* Community Feedback Section */}
        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-8 mb-12 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-yellow-500/20 rounded-xl">
              <CheckCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Rate this Discussion</h3>
          </div>
          <ForumFeedbackForm forumPostId={post.id} />
        </div>

        {/* Enhanced Add comment form */}
        {user ? (
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700 p-8 mb-12 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <Send className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Join the Discussion</h3>
            </div>
            <form onSubmit={handleCommentSubmit} className="space-y-6">
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
                className="w-full p-4 bg-zinc-700/50 border border-zinc-600 rounded-xl text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-lg resize-none"
                disabled={isSubmittingComment}
              />
              
              {/* Enhanced status indicators */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Live updates active</span>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {newComment.length}/5 characters minimum
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingComment || newComment.trim().length < 5}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105 flex items-center space-x-2 shadow-lg disabled:hover:scale-100"
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
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-8 mb-12 shadow-xl">
            <div className="text-center space-y-4">
              <div className="p-4 bg-blue-500/20 rounded-2xl w-fit mx-auto">
                <User className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Join the Discussion</h3>
              <p className="text-zinc-400 leading-relaxed">
                <Link 
                  href="/auth/login" 
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Log in
                </Link> to share your thoughts and engage with the community.
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Comments Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between bg-zinc-800/30 rounded-2xl p-6 border border-zinc-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <MessageSquare className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Discussion ({pagination?.total_comments || 0})
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-green-400 text-sm bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live comments</span>
            </div>
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto space-y-6">
                <div className="p-8 bg-zinc-800/30 rounded-2xl border border-zinc-700">
                  <MessageSquare className="h-16 w-16 text-purple-400 mx-auto mb-6" />
                  <h4 className="text-xl font-bold text-white mb-4">Start the Conversation</h4>
                  <p className="text-zinc-400">No comments yet. Be the first to share your thoughts!</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {comments.map((comment, index) => {
                  // Use UTC for time comparison (more reliable)
                  const commentTime = new Date(comment.created_at);
                  const now = new Date();
                  const timeDiff = now.getTime() - commentTime.getTime();
                  
                  // Show effect for newly added comments OR comments less than 2 minutes old
                  const isNew = newlyAddedCommentIds.has(comment.id) || (timeDiff < 120000);
                  
                  return (
                    <div 
                      key={comment.id} 
                      className={`backdrop-blur-sm rounded-2xl border p-6 transition-all duration-1000 relative shadow-lg hover:shadow-xl ${
                        isNew 
                          ? 'border-2 border-green-500/50 bg-gradient-to-r from-green-900/30 to-blue-900/30 shadow-green-500/20' 
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/70'
                      }`}
                    >
                      {isNew && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                          ✨ New
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-xl ${isNew ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                            <User className={`h-4 w-4 ${isNew ? 'text-green-400' : 'text-purple-400'}`} />
                          </div>
                          <div>
                            <span className={`font-semibold text-lg ${isNew ? 'text-green-100' : 'text-white'}`}>
                              {comment.username}
                            </span>
                            <div className="flex items-center space-x-2 text-zinc-400 text-sm mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(comment.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`rounded-xl p-4 ${isNew ? 'bg-zinc-700/30' : 'bg-zinc-700/20'} border border-zinc-600/30`}>
                        <p className="text-zinc-200 leading-relaxed">{comment.comment}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex justify-center items-center space-x-8 mt-12">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.has_previous}
                    className="flex items-center space-x-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg disabled:hover:scale-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Previous</span>
                  </button>
                  
                  <div className="bg-zinc-800/50 border border-zinc-700 px-6 py-4 rounded-2xl shadow-xl">
                    <span className="text-zinc-200 font-semibold">
                      Page {pagination.current_page} of {pagination.total_pages}
                    </span>
                    <p className="text-xs text-zinc-400 mt-1">
                      Total: {pagination.total_comments} comments
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.has_next}
                    className="flex items-center space-x-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg disabled:hover:scale-100"
                  >
                    <span>Next</span>
                    <ArrowLeft className="h-5 w-5 rotate-180" />
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
