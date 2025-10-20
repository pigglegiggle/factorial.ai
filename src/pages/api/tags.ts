import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { limit = '50' } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 100);

    // Get all tags with usage count
    const tags = await sql`
      SELECT 
        t.id,
        t.name,
        COUNT(nt.news_check_id) as usage_count
      FROM tags t
      LEFT JOIN news_tags nt ON t.id = nt.tag_id
      GROUP BY t.id, t.name
      ORDER BY usage_count DESC, t.name ASC
      LIMIT ${limitNum}
    `;

    return res.status(200).json({
      tags: tags,
      total_tags: tags.length,
    });

  } catch (error) {
    console.error('Get tags error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name } = req.body;

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Tag name must be at least 2 characters long' });
    }

    const tagName = name.trim().toLowerCase();

    // Check if tag already exists
    const existingTag = await sql`
      SELECT id FROM tags WHERE name = ${tagName}
    `;

    if (existingTag.length > 0) {
      return res.status(409).json({ error: 'Tag already exists' });
    }

    // Create new tag
    const tagResult = await sql`
      INSERT INTO tags (name)
      VALUES (${tagName})
      RETURNING id, name, created_at
    `;

    return res.status(200).json({
      id: tagResult[0].id,
      name: tagResult[0].name,
      message: 'Tag created successfully',
      created_at: tagResult[0].created_at,
    });

  } catch (error: any) {
    console.error('Create tag error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Tag already exists' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
