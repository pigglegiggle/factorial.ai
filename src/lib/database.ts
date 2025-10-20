import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export { sql };

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin' | 'moderator';
  created_at: Date;
}

export interface NewsCheck {
  id: number;
  user_id: number;
  input_text?: string;
  input_url?: string;
  result_json: {
    is_fake: boolean;
    confidence: number;
    explanation: string;
    tags: string[];
  };
  is_fake: boolean;
  confidence: number;
  created_at: Date;
}

export interface NewsFeedback {
  id: number;
  user_id: number;
  news_check_id: number;
  rating: number;
  comment?: string;
  created_at: Date;
}

export interface ForumPost {
  id: number;
  user_id: number;
  news_check_id: number;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: Date;
}

export interface ForumComment {
  id: number;
  post_id: number;
  user_id: number;
  comment: string;
  created_at: Date;
}

export interface Tag {
  id: number;
  name: string;
  created_at: Date;
}

export interface ForumVote {
  id: number;
  user_id: number;
  post_id: number;
  vote_type: 'upvote' | 'downvote';
  created_at: Date;
}
