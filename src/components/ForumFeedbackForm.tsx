'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Star, Send, CheckCircle, MessageSquare, AlertTriangle } from 'lucide-react';

interface ForumFeedbackFormProps {
  forumPostId: number;
  onSubmitSuccess?: () => void;
}

export default function ForumFeedbackForm({ forumPostId, onSubmitSuccess }: ForumFeedbackFormProps) {
  const { user, token } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackType, setFeedbackType] = useState<'analysis_quality' | 'post_helpfulness' | 'community_value'>('analysis_quality');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const feedbackTypes = {
    analysis_quality: {
      label: 'AI Analysis Quality',
      description: 'How accurate and helpful was the AI analysis?'
    },
    post_helpfulness: {
      label: 'Post Helpfulness',
      description: 'How helpful was this discussion post?'
    },
    community_value: {
      label: 'Community Value',
      description: 'How valuable is this post to the community?'
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Please log in to submit feedback');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/forum/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          forum_post_id: forumPostId,
          rating,
          comment: comment.trim() || null,
          feedback_type: feedbackType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setRating(0);
        setComment('');
        setShowForm(false);
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Forum feedback submission error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-4">
        <div className="text-center space-y-3">
          <div className="p-2 bg-blue-500/20 rounded-lg w-fit mx-auto">
            <Star className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-sm text-zinc-400">
            <button 
              onClick={() => window.location.href = '/auth/login'}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Log in
            </button> to provide feedback on this discussion
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="bg-zinc-800/30 rounded-xl border border-green-500/20 p-4">
        <div className="text-center space-y-3">
          <div className="p-2 bg-green-500/20 rounded-lg w-fit mx-auto">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-300 mb-1">Feedback Submitted!</h4>
            <p className="text-xs text-zinc-400">Thank you for helping improve our community.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-4">
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group"
        >
          <Star className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Rate this discussion</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-blue-500/20 rounded-lg">
            <Star className="h-4 w-4 text-blue-400" />
          </div>
          <h4 className="text-sm font-semibold text-white">Rate Discussion</h4>
        </div>
        <button
          onClick={() => setShowForm(false)}
          className="text-zinc-400 hover:text-zinc-300 text-sm"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Feedback Type Selection */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-2">
            What would you like to rate?
          </label>
          <div className="space-y-2">
            {Object.entries(feedbackTypes).map(([key, type]) => (
              <label key={key} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="feedbackType"
                  value={key}
                  checked={feedbackType === key}
                  onChange={(e) => setFeedbackType(e.target.value as any)}
                  className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                      {type.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-2">
            Rating
          </label>
          <div className="flex space-x-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`transition-all duration-200 hover:scale-110 ${
                  star <= rating
                    ? 'text-yellow-400'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <Star className={`h-5 w-5 ${star <= rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-zinc-400">
              {rating} out of 5 stars
            </p>
          )}
        </div>

        {/* Comment Field */}
        <div>
          <label htmlFor="comment" className="block text-xs font-medium text-zinc-300 mb-2">
            Additional comments (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full p-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-colors resize-none text-sm"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="flex-1 bg-zinc-600 hover:bg-zinc-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-3 w-3" />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
