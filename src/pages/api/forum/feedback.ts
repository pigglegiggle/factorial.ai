import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/database';
import { improvedModelTrainer } from '@/lib/improved-model-trainer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  } else if (req.method === 'GET') {
    return handleGet(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { forum_post_id, rating, comment, feedback_type } = req.body;

    // Validate input
    if (!forum_post_id || !rating || !feedback_type) {
      return res.status(400).json({ error: 'forum_post_id, rating, and feedback_type are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const validFeedbackTypes = ['analysis_quality', 'post_helpfulness', 'community_value'];
    if (!validFeedbackTypes.includes(feedback_type)) {
      return res.status(400).json({ error: 'Invalid feedback type' });
    }

    // Verify forum post exists
    const forumPost = await sql`
      SELECT fp.*, u.username, nc.input_text, nc.input_url, nc.result_json, nc.is_fake, nc.confidence
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      JOIN news_checks nc ON fp.news_check_id = nc.id
      WHERE fp.id = ${forum_post_id}
    `;

    if (forumPost.length === 0) {
      return res.status(404).json({ error: 'Forum post not found' });
    }

    // Check if user already provided feedback for this post
    const existingFeedback = await sql`
      SELECT id FROM forum_feedback 
      WHERE forum_post_id = ${forum_post_id} AND user_id = ${user.id}
    `;

    if (existingFeedback.length > 0) {
      // Update existing feedback
      await sql`
        UPDATE forum_feedback 
        SET rating = ${rating}, 
            comment = ${comment || null},
            feedback_type = ${feedback_type},
            updated_at = NOW()
        WHERE forum_post_id = ${forum_post_id} AND user_id = ${user.id}
      `;
    } else {
      // Insert new feedback
      await sql`
        INSERT INTO forum_feedback (forum_post_id, user_id, rating, comment, feedback_type, created_at)
        VALUES (${forum_post_id}, ${user.id}, ${rating}, ${comment || null}, ${feedback_type}, NOW())
      `;
    }

    // Log the feedback for analysis (similar to news feedback)
    const feedbackData = {
      forum_post_id,
      user_id: user.id,
      username: user.username,
      rating,
      comment,
      feedback_type,
      timestamp: new Date().toISOString(),
      post_content: forumPost[0].content,
      input_text: forumPost[0].input_text,
      input_url: forumPost[0].input_url,
      ai_analysis: forumPost[0].result_json,
      is_fake: forumPost[0].is_fake,
      confidence: forumPost[0].confidence
    };

    // Process feedback for model improvement
    await improvedModelTrainer.processForumFeedback(
      forum_post_id,
      user.id,
      rating,
      comment || '',
      feedback_type,
      forumPost[0].is_fake ? 'fake' : 'real',
      forumPost[0].confidence
    );

    // You can extend this to log to file or external service
    console.log('Forum feedback submitted:', feedbackData);

    return res.status(200).json({ 
      message: 'Feedback submitted successfully',
      feedback: {
        forum_post_id,
        rating,
        comment,
        feedback_type
      }
    });

  } catch (error) {
    console.error('Error submitting forum feedback:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { forum_post_id } = req.query;

    if (!forum_post_id) {
      return res.status(400).json({ error: 'forum_post_id is required' });
    }

    // Get feedback statistics for the forum post
    const feedbackStats = await sql`
      SELECT 
        feedback_type,
        AVG(rating)::NUMERIC(3,2) as avg_rating,
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
        COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback
      FROM forum_feedback 
      WHERE forum_post_id = ${forum_post_id}
      GROUP BY feedback_type
    `;

    // Get recent feedback comments (last 5)
    const recentFeedback = await sql`
      SELECT ff.rating, ff.comment, ff.feedback_type, ff.created_at, u.username
      FROM forum_feedback ff
      JOIN users u ON ff.user_id = u.id
      WHERE ff.forum_post_id = ${forum_post_id} AND ff.comment IS NOT NULL
      ORDER BY ff.created_at DESC
      LIMIT 5
    `;

    return res.status(200).json({
      statistics: feedbackStats,
      recent_comments: recentFeedback
    });

  } catch (error) {
    console.error('Error fetching forum feedback:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
