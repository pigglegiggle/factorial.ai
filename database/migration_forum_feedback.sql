-- Migration to add forum_feedback table
-- Run this script to add forum feedback functionality to existing databases

-- Forum feedback table (for community feedback on forum posts)
CREATE TABLE IF NOT EXISTS forum_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    forum_post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('analysis_quality', 'post_helpfulness', 'community_value')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, forum_post_id) -- One feedback per user per forum post
);

-- Feedback analysis table for AI model improvement (supports both news and forum feedback)
CREATE TABLE IF NOT EXISTS feedback_analysis (
    id SERIAL PRIMARY KEY,
    news_check_id INTEGER REFERENCES news_checks(id) ON DELETE CASCADE,
    forum_post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_agrees_with_ai BOOLEAN NOT NULL,
    confidence_in_disagreement INTEGER DEFAULT 50,
    comment_sentiment VARCHAR(20) CHECK (comment_sentiment IN ('positive', 'negative', 'neutral')),
    key_phrases TEXT[],
    ai_classification VARCHAR(10) CHECK (ai_classification IN ('fake', 'real')),
    ai_confidence INTEGER,
    should_adjust_confidence BOOLEAN DEFAULT false,
    adjustment_weight DECIMAL(5,4) DEFAULT 0.0,
    feedback_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_feedback_source CHECK (news_check_id IS NOT NULL OR forum_post_id IS NOT NULL)
);

-- Model performance tracking table
CREATE TABLE IF NOT EXISTS model_performance (
    id SERIAL PRIMARY KEY,
    total_analyses INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 85.00,
    overconfident_cases INTEGER DEFAULT 0,
    underconfident_cases INTEGER DEFAULT 0,
    confidence_calibration JSONB DEFAULT '{}',
    content_type_performance JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content patterns table for pattern recognition and learning
CREATE TABLE IF NOT EXISTS content_patterns (
    id SERIAL PRIMARY KEY,
    pattern_hash VARCHAR(32) UNIQUE NOT NULL,
    content_keywords TEXT[],
    classification VARCHAR(10) CHECK (classification IN ('fake', 'real', 'opinion', 'satirical')),
    confidence_level INTEGER,
    evidence_count INTEGER DEFAULT 1,
    accuracy_rate DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_feedback_forum_post_id ON forum_feedback(forum_post_id);
CREATE INDEX IF NOT EXISTS idx_forum_feedback_user_id ON forum_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_news_check_id ON feedback_analysis(news_check_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_forum_post_id ON feedback_analysis(forum_post_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_user_id ON feedback_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_created_at ON feedback_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_content_patterns_pattern_hash ON content_patterns(pattern_hash);
CREATE INDEX IF NOT EXISTS idx_model_performance_active ON model_performance(active);

-- Verify the migration
SELECT 'Forum feedback and AI learning tables created successfully' as migration_status;
