import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    // Get user's news check history
    const history = await sql`
      SELECT 
        nc.id,
        nc.input_text,
        nc.input_url,
        nc.result_json,
        nc.is_fake,
        nc.confidence,
        nc.created_at,
        ARRAY_AGG(DISTINCT t.name) as tags,
        COUNT(DISTINCT nf.id) as feedback_count,
        COUNT(DISTINCT fp.id) as forum_posts_count
      FROM news_checks nc
      LEFT JOIN news_tags nt ON nc.id = nt.news_check_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      LEFT JOIN news_feedback nf ON nc.id = nf.news_check_id
      LEFT JOIN forum_posts fp ON nc.id = fp.news_check_id
      WHERE nc.user_id = ${user.id}
      GROUP BY nc.id, nc.input_text, nc.input_url, nc.result_json, nc.is_fake, nc.confidence, nc.created_at
      ORDER BY nc.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total 
      FROM news_checks 
      WHERE user_id = ${user.id}
    `;

    const totalChecks = countResult[0].total;

    // Get user statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_checks,
        COUNT(CASE WHEN is_fake = true THEN 1 END) as fake_count,
        COUNT(CASE WHEN is_fake = false THEN 1 END) as real_count,
        AVG(confidence) as avg_confidence
      FROM news_checks 
      WHERE user_id = ${user.id}
    `;

    return res.status(200).json({
      history: history.map((item: any) => ({
        ...item,
        tags: item.tags ? item.tags.filter(Boolean) : [], // Remove null values
      })),
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(totalChecks / limitNum),
        total_checks: totalChecks,
        has_next: pageNum * limitNum < totalChecks,
        has_previous: pageNum > 1,
      },
      statistics: {
        total_checks: stats[0].total_checks,
        fake_count: stats[0].fake_count,
        real_count: stats[0].real_count,
        avg_confidence: Math.round((stats[0].avg_confidence || 0) * 10) / 10,
        fake_percentage: stats[0].total_checks > 0 
          ? Math.round((stats[0].fake_count / stats[0].total_checks) * 100)
          : 0,
      },
    });

  } catch (error) {
    console.error('Get user history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
