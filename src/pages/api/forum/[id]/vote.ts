import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const { id } = req.query;
    const postId = parseInt(id as string);
    const { vote_type } = req.body;

    // Validate input
    if (!vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return res.status(400).json({ error: 'vote_type must be "upvote" or "downvote"' });
    }

    // Check if post exists
    const post = await sql`
      SELECT id FROM forum_posts WHERE id = ${postId}
    `;

    if (post.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check existing vote
    const existingVote = await sql`
      SELECT vote_type FROM forum_votes 
      WHERE user_id = ${user.id} AND post_id = ${postId}
    `;

    if (existingVote.length > 0) {
      const currentVoteType = existingVote[0].vote_type;
      
      if (currentVoteType === vote_type) {
        // Remove vote (toggle off)
        await sql`
          DELETE FROM forum_votes 
          WHERE user_id = ${user.id} AND post_id = ${postId}
        `;

        // Update post counts
        if (vote_type === 'upvote') {
          await sql`
            UPDATE forum_posts 
            SET upvotes = upvotes - 1 
            WHERE id = ${postId}
          `;
        } else {
          await sql`
            UPDATE forum_posts 
            SET downvotes = downvotes - 1 
            WHERE id = ${postId}
          `;
        }

        return res.status(200).json({
          message: 'Vote removed',
          action: 'removed',
        });
      } else {
        // Change vote type
        await sql`
          UPDATE forum_votes 
          SET vote_type = ${vote_type}
          WHERE user_id = ${user.id} AND post_id = ${postId}
        `;

        // Update post counts (remove old, add new)
        if (vote_type === 'upvote') {
          await sql`
            UPDATE forum_posts 
            SET upvotes = upvotes + 1, downvotes = downvotes - 1 
            WHERE id = ${postId}
          `;
        } else {
          await sql`
            UPDATE forum_posts 
            SET upvotes = upvotes - 1, downvotes = downvotes + 1 
            WHERE id = ${postId}
          `;
        }

        return res.status(200).json({
          message: 'Vote updated',
          action: 'updated',
          vote_type,
        });
      }
    } else {
      // Add new vote
      await sql`
        INSERT INTO forum_votes (user_id, post_id, vote_type)
        VALUES (${user.id}, ${postId}, ${vote_type})
      `;

      // Update post counts
      if (vote_type === 'upvote') {
        await sql`
          UPDATE forum_posts 
          SET upvotes = upvotes + 1 
          WHERE id = ${postId}
        `;
      } else {
        await sql`
          UPDATE forum_posts 
          SET downvotes = downvotes + 1 
          WHERE id = ${postId}
        `;
      }

      return res.status(200).json({
        message: 'Vote added',
        action: 'added',
        vote_type,
      });
    }

  } catch (error: any) {
    console.error('Forum vote error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
