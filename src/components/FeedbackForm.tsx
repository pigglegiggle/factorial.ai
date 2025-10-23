'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Star, Send, CheckCircle } from 'lucide-react';

interface FeedbackFormProps {
  newsCheckId: number;
}

export default function FeedbackForm({ newsCheckId }: FeedbackFormProps) {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Authentication required');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          news_check_id: newsCheckId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setRating(0);
        setComment('');
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-6 shadow-xl h-full flex flex-col justify-center">
        <div className="text-center flex flex-col justify-center items-center min-h-[200px]">
          <div className="p-4 bg-green-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Thank you for your feedback!</h3>
          <p className="text-zinc-400">Your input helps improve our AI analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 p-6 shadow-xl h-full flex flex-col justify-start">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Star className="h-5 w-5 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Rate this Analysis</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enhanced Star Rating */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            How accurate was this analysis?
          </label>
          <div className="flex space-x-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-1 transition-all duration-200 hover:scale-110 ${
                  star <= rating
                    ? 'text-yellow-400'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <Star className={`h-7 w-7 ${star <= rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-zinc-400">
              {rating} out of 5 stars
            </p>
          )}
        </div>

        {/* Enhanced Comment Field */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-zinc-300 mb-2">
            Comments (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any additional thoughts..."
            rows={4}
            className="w-full p-4 bg-zinc-700/50 border border-zinc-600 rounded-xl text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors resize-none"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold disabled:bg-zinc-600 disabled:cursor-not-allowed transition-all hover:scale-[1.02] flex items-center justify-center space-x-2 shadow-lg"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit Feedback</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
