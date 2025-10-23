-- Migration to add forum feedback support to existing feedback_analysis table
-- This safely adds the missing columns without breaking existing data

-- Add forum_post_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feedback_analysis' AND column_name = 'forum_post_id') THEN
        ALTER TABLE feedback_analysis ADD COLUMN forum_post_id INTEGER REFERENCES forum_posts(id);
    END IF;
END $$;

-- Add feedback_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feedback_analysis' AND column_name = 'feedback_type') THEN
        ALTER TABLE feedback_analysis ADD COLUMN feedback_type VARCHAR(30);
    END IF;
END $$;

-- Add constraint to ensure at least one source is specified (if not already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
                   WHERE constraint_name = 'check_feedback_source') THEN
        ALTER TABLE feedback_analysis ADD CONSTRAINT check_feedback_source 
        CHECK (news_check_id IS NOT NULL OR forum_post_id IS NOT NULL);
    END IF;
END $$;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_forum_post ON feedback_analysis(forum_post_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_feedback_type ON feedback_analysis(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_created_at ON feedback_analysis(created_at);

-- Verify the migration
SELECT 'Forum feedback columns added successfully to feedback_analysis table' as migration_status;
