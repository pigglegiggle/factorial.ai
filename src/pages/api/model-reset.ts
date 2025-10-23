import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { improvedModelTrainer } from '@/lib/improved-model-trainer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication (optional - you might want to restrict this to admin users)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Reset model performance
    await improvedModelTrainer.resetModelPerformance();

    // Get current insights to confirm reset
    const insights = await improvedModelTrainer.getLearningInsights();

    return res.status(200).json({
      message: 'Model performance reset successfully',
      currentInsights: insights
    });

  } catch (error: any) {
    console.error('Model reset error:', error);
    return res.status(500).json({ error: 'Failed to reset model performance' });
  }
}
