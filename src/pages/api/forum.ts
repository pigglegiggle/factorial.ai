import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/database';

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

    const { news_check_id, content } = req.body;

    // Validate input
    if (!news_check_id || !content) {
      return res.status(400).json({ error: 'news_check_id and content are required' });
    }

    if (content.length < 10) {
      return res.status(400).json({ error: 'Post content must be at least 10 characters long' });
    }

    // Verify news check exists
    const newsCheck = await sql`
      SELECT id FROM news_checks WHERE id = ${news_check_id}
    `;

    if (newsCheck.length === 0) {
      return res.status(404).json({ error: 'News check not found' });
    }

    // Create forum post
    const postResult = await sql`
      INSERT INTO forum_posts (user_id, news_check_id, content)
      VALUES (${user.id}, ${news_check_id}, ${content})
      RETURNING id, created_at
    `;

    return res.status(200).json({
      id: postResult[0].id,
      message: 'Forum post created successfully',
      created_at: postResult[0].created_at,
    });

  } catch (error: any) {
    console.error('Forum post creation error:', error);
    
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({ error: 'Invalid news_check_id' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { page = '1', limit = '10', tag, sort = 'recent' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50);
    const offset = (pageNum - 1) * limitNum;

    // Check if user is authenticated (optional for GET requests)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = verifyToken(token);
      if (user) {
        userId = user.id;
      }
    }

    // Build the query with optional tag filtering
    let posts;
    let totalPosts;

    if (tag) {
      // Query with tag filtering
      posts = await sql`
        SELECT 
          fp.id,
          fp.content,
          fp.upvotes,
          fp.downvotes,
          fp.created_at,
          u.username,
          nc.result_json,
          nc.is_fake,
          nc.confidence,
          COALESCE(nc.input_text, nc.input_url) as news_content,
          ARRAY_AGG(DISTINCT t.name) as tags,
          ${userId ? sql`fv.vote_type as user_vote` : sql`NULL as user_vote`}
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.id
        JOIN news_checks nc ON fp.news_check_id = nc.id
        LEFT JOIN news_tags nt ON nc.id = nt.news_check_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        ${userId ? sql`LEFT JOIN forum_votes fv ON fp.id = fv.post_id AND fv.user_id = ${userId}` : sql``}
        WHERE EXISTS (
          SELECT 1 FROM news_tags nt2
          JOIN tags t2 ON nt2.tag_id = t2.id
          WHERE nt2.news_check_id = nc.id AND t2.name = ${tag as string}
        )
        GROUP BY fp.id, fp.content, fp.upvotes, fp.downvotes, fp.created_at, 
                 u.username, nc.result_json, nc.is_fake, nc.confidence, nc.input_text, nc.input_url, fv.vote_type
        ORDER BY fp.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;

      const countResult = await sql`
        SELECT COUNT(DISTINCT fp.id) as total
        FROM forum_posts fp
        JOIN news_checks nc ON fp.news_check_id = nc.id
        WHERE EXISTS (
          SELECT 1 FROM news_tags nt
          JOIN tags t ON nt.tag_id = t.id
          WHERE nt.news_check_id = nc.id AND t.name = ${tag as string}
        )
      `;
      totalPosts = countResult[0].total;
    } else {
      // Query without tag filtering
      posts = await sql`
        SELECT 
          fp.id,
          fp.content,
          fp.upvotes,
          fp.downvotes,
          fp.created_at,
          u.username,
          nc.result_json,
          nc.is_fake,
          nc.confidence,
          COALESCE(nc.input_text, nc.input_url) as news_content,
          ARRAY_AGG(DISTINCT t.name) as tags,
          ${userId ? sql`fv.vote_type as user_vote` : sql`NULL as user_vote`}
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.id
        JOIN news_checks nc ON fp.news_check_id = nc.id
        LEFT JOIN news_tags nt ON nc.id = nt.news_check_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        ${userId ? sql`LEFT JOIN forum_votes fv ON fp.id = fv.post_id AND fv.user_id = ${userId}` : sql``}
        GROUP BY fp.id, fp.content, fp.upvotes, fp.downvotes, fp.created_at, 
                 u.username, nc.result_json, nc.is_fake, nc.confidence, nc.input_text, nc.input_url, fv.vote_type
        ORDER BY fp.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;

      const countResult = await sql`
        SELECT COUNT(*) as total FROM forum_posts
      `;
      totalPosts = countResult[0].total;
    }

    return res.status(200).json({
      posts: posts.map((post: any) => ({
        ...post,
        tags: post.tags ? post.tags.filter(Boolean) : [], // Remove null values
        user_vote: post.user_vote || null, // Include user vote
      })),
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(totalPosts / limitNum),
        total_posts: totalPosts,
        has_next: pageNum * limitNum < totalPosts,
        has_previous: pageNum > 1,
      },
    });

  } catch (error) {
    console.error('Get forum posts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
