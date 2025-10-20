import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const postId = parseInt(id as string);

  if (req.method === 'POST') {
    return handlePost(req, res, postId);
  } else if (req.method === 'GET') {
    return handleGet(req, res, postId);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, postId: number) {
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

    const { comment } = req.body;

    // Validate input
    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({ error: 'Comment must be at least 5 characters long' });
    }

    // Check if post exists
    const post = await sql`
      SELECT id FROM forum_posts WHERE id = ${postId}
    `;

    if (post.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Create comment and return full comment data
    const commentResult = await sql`
      INSERT INTO forum_comments (post_id, user_id, comment)
      VALUES (${postId}, ${user.id}, ${comment.trim()})
      RETURNING id, created_at
    `;

    // Get the complete comment data with username
    const fullComment = await sql`
      SELECT 
        fc.id,
        fc.comment,
        fc.created_at,
        u.username
      FROM forum_comments fc
      JOIN users u ON fc.user_id = u.id
      WHERE fc.id = ${commentResult[0].id}
    `;

    return res.status(200).json({
      message: 'Comment added successfully',
      comment: fullComment[0]
    });

  } catch (error: any) {
    console.error('Forum comment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, postId: number) {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50);
    const offset = (pageNum - 1) * limitNum;

    // Get comments for the post
    const comments = await sql`
      SELECT 
        fc.id,
        fc.comment,
        fc.created_at,
        u.username
      FROM forum_comments fc
      JOIN users u ON fc.user_id = u.id
      WHERE fc.post_id = ${postId}
      ORDER BY fc.created_at ASC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total 
      FROM forum_comments 
      WHERE post_id = ${postId}
    `;

    const totalComments = countResult[0].total;

    return res.status(200).json({
      comments,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(totalComments / limitNum),
        total_comments: totalComments,
        has_next: pageNum * limitNum < totalComments,
        has_previous: pageNum > 1,
      },
    });

  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
