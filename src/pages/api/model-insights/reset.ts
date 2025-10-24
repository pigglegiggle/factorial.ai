import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { improvedModelTrainer } from '@/lib/improved-model-trainer';

interface User {
  id: number;
  username: string;
  email: string;
}

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
    let user: User;

    try {
      user = jwt.verify(token, process.env.JWT_SECRET!) as User;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Additional admin check (optional - you can implement admin roles)
    // For now, any authenticated user can reset (you might want to restrict this)
    console.log(`🔄 Model reset requested by user: ${user.username} (ID: ${user.id})`);

    // Reset model performance using the improved model trainer
    await improvedModelTrainer.resetModelPerformance();

    console.log(`✅ Model performance reset completed by user ${user.username}`);

    return res.status(200).json({ 
      success: true,
      message: 'Model performance has been reset to baseline',
      reset_by: user.username,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error resetting model performance:', error);
    return res.status(500).json({ 
      error: 'Failed to reset model performance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
