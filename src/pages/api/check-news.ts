import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/database';
import { analyzeNewsWithGemini } from '@/lib/gemini';

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

    const { input_text, input_url } = req.body;

    // Validate input
    if (!input_text && !input_url) {
      return res.status(400).json({ error: 'Either input_text or input_url is required' });
    }

    // Determine what to analyze
    const contentToAnalyze = input_url || input_text;
    const isUrl = !!input_url;

    // Call Gemini API
    const geminiResult = await analyzeNewsWithGemini(contentToAnalyze, isUrl);

    // Get or create tags
    const tagResults = await Promise.all(
      geminiResult.tags.map(async (tagName: string) => {
        // Try to get existing tag
        let tagResult = await sql`
          SELECT id FROM tags WHERE name = ${tagName.toLowerCase()}
        `;

        if (tagResult.length === 0) {
          // Create new tag
          tagResult = await sql`
            INSERT INTO tags (name) VALUES (${tagName.toLowerCase()})
            RETURNING id
          `;
        }

        return tagResult[0].id;
      })
    );

    // Save news check to database
    const newsCheckResult = await sql`
      INSERT INTO news_checks (
        user_id, 
        input_text, 
        input_url, 
        result_json, 
        is_fake, 
        confidence
      )
      VALUES (
        ${user.id},
        ${input_text || null},
        ${input_url || null},
        ${JSON.stringify(geminiResult)},
        ${geminiResult.is_fake},
        ${geminiResult.confidence}
      )
      RETURNING id, created_at
    `;

    const newsCheckId = newsCheckResult[0].id;

    // Associate tags with news check
    if (tagResults.length > 0) {
      await Promise.all(
        tagResults.map(tagId =>
          sql`
            INSERT INTO news_tags (news_check_id, tag_id)
            VALUES (${newsCheckId}, ${tagId})
            ON CONFLICT (news_check_id, tag_id) DO NOTHING
          `
        )
      );
    }

    return res.status(200).json({
      id: newsCheckId,
      result: geminiResult,
      created_at: newsCheckResult[0].created_at,
      message: 'News analysis completed successfully',
    });

  } catch (error: any) {
    console.error('News check error:', error);
    
    if (error.message.includes('Failed to analyze')) {
      return res.status(503).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
