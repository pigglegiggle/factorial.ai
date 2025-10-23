import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/database';
import { logFeedbackToFile } from '@/lib/feedback-logger';
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

    const { news_check_id, rating, comment } = req.body;

    // Validate input
    if (!news_check_id || !rating) {
      return res.status(400).json({ error: 'news_check_id and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify news check exists and belongs to user or is public
    const newsCheck = await sql`
      SELECT nc.*, u.username
      FROM news_checks nc
      JOIN users u ON nc.user_id = u.id
      WHERE nc.id = ${news_check_id}
    `;

    if (newsCheck.length === 0) {
      return res.status(404).json({ error: 'News check not found' });
    }

    // Save feedback to database (upsert - update if exists, insert if not)
    const feedbackResult = await sql`
      INSERT INTO news_feedback (user_id, news_check_id, rating, comment)
      VALUES (${user.id}, ${news_check_id}, ${rating}, ${comment || null})
      ON CONFLICT (user_id, news_check_id) 
      DO UPDATE SET 
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        created_at = CURRENT_TIMESTAMP
      RETURNING id, created_at
    `;

    // Log feedback to JSON file for offline analysis
    try {
      await logFeedbackToFile({
        timestamp: new Date().toISOString(),
        news_check_id,
        user_id: user.id,
        rating,
        comment,
        news_content: newsCheck[0].input_text || newsCheck[0].input_url,
        analysis_result: newsCheck[0].result_json,
      });
    } catch (logError) {
      console.error('Failed to log feedback to file:', logError);
      // Continue execution as file logging is optional
    }

    // Process feedback with improved model trainer for learning
    try {
      const contentToAnalyze = newsCheck[0].input_text || newsCheck[0].input_url;
      const analysisResult = newsCheck[0].result_json;
      
      if (contentToAnalyze && analysisResult && comment) {
        await improvedModelTrainer.enhanceAnalysis(
          contentToAnalyze,
          analysisResult,
          news_check_id,
          user.id,
          { rating, comment }
        );
        console.log('✅ Feedback processed by improved model trainer');
      }
    } catch (modelError) {
      console.error('Failed to process feedback with model trainer:', modelError);
      // Continue execution as model training is supplementary
    }

    return res.status(200).json({
      id: feedbackResult[0].id,
      message: 'Feedback saved successfully',
      created_at: feedbackResult[0].created_at,
    });

  } catch (error: any) {
    console.error('Feedback submission error:', error);
    
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({ error: 'Invalid news_check_id' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { news_check_id } = req.query;

    if (!news_check_id) {
      return res.status(400).json({ error: 'news_check_id parameter is required' });
    }

    // Get all feedback for the news check
    const feedback = await sql`
      SELECT 
        nf.id,
        nf.rating,
        nf.comment,
        nf.created_at,
        u.username
      FROM news_feedback nf
      JOIN users u ON nf.user_id = u.id
      WHERE nf.news_check_id = ${news_check_id as string}
      ORDER BY nf.created_at DESC
    `;

    // Calculate average rating
    const avgRating = feedback.length > 0 
      ? feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length
      : 0;

    return res.status(200).json({
      feedback: feedback,
      statistics: {
        total_feedback: feedback.length,
        average_rating: Math.round(avgRating * 10) / 10,
      },
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
