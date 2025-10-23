-- Model Knowledge and Performance Tracking Tables

-- Create enum types first (must be before tables that use them)
DO $$ BEGIN
    CREATE TYPE sentiment_type AS ENUM ('positive', 'negative', 'neutral');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE classification_type AS ENUM ('fake', 'real', 'opinion', 'satirical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Store model performance metrics and learning state
CREATE TABLE IF NOT EXISTS model_performance (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_analyses INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
    overconfident_cases INTEGER DEFAULT 0,
    underconfident_cases INTEGER DEFAULT 0,
    confidence_calibration JSONB DEFAULT '{}',
    content_type_performance JSONB DEFAULT '{}',
    learning_rate DECIMAL(4,3) DEFAULT 0.100,
    active BOOLEAN DEFAULT true
);

-- Store individual content pattern learning
CREATE TABLE IF NOT EXISTS content_patterns (
    id SERIAL PRIMARY KEY,
    pattern_hash VARCHAR(64) UNIQUE NOT NULL, -- Hash of similar content
    content_keywords TEXT[], -- Key phrases and terms
    classification classification_type,
    confidence_level INTEGER, -- 0-100
    evidence_count INTEGER DEFAULT 1, -- How many times we've seen this pattern
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00, -- Success rate for this pattern
    user_feedback_summary JSONB DEFAULT '{}' -- Aggregated user feedback
);

-- Store semantic feedback analysis (separate from star ratings)
CREATE TABLE IF NOT EXISTS feedback_analysis (
    id SERIAL PRIMARY KEY,
    news_check_id INTEGER REFERENCES news_checks(id),
    forum_post_id INTEGER REFERENCES forum_posts(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Semantic analysis of user comment
    user_agrees_with_ai BOOLEAN, -- Does user agree with AI assessment?
    confidence_in_disagreement INTEGER, -- 0-100 how confident user seems
    comment_sentiment sentiment_type,
    key_phrases TEXT[], -- Important phrases from comment
    
    -- AI assessment context
    ai_classification classification_type,
    ai_confidence INTEGER,
    
    -- Learning impact
    should_adjust_confidence BOOLEAN DEFAULT false,
    adjustment_weight DECIMAL(3,2) DEFAULT 0.00, -- How much this should influence learning
    feedback_type VARCHAR(30), -- Type of feedback (analysis_quality, post_helpfulness, etc.)
    
    -- Ensure at least one source is specified
    CONSTRAINT check_feedback_source CHECK (news_check_id IS NOT NULL OR forum_post_id IS NOT NULL)
);

-- Insert initial model performance record
INSERT INTO model_performance (total_analyses, accuracy_percentage, active)
VALUES (0, 100.00, true)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_model_performance_active ON model_performance(active);
CREATE INDEX IF NOT EXISTS idx_content_patterns_hash ON content_patterns(pattern_hash);
CREATE INDEX IF NOT EXISTS idx_content_patterns_keywords ON content_patterns USING GIN(content_keywords);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_news_check ON feedback_analysis(news_check_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_forum_post ON feedback_analysis(forum_post_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_user_agrees ON feedback_analysis(user_agrees_with_ai);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_created_at ON feedback_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_feedback_type ON feedback_analysis(feedback_type);
