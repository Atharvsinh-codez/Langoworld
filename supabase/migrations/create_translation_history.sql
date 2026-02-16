-- Create translation_history table for persisting translation history per user
CREATE TABLE IF NOT EXISTS translation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    source_lang VARCHAR(10) NOT NULL DEFAULT 'en',
    translations JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_translation_history_user_id ON translation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_translation_history_created_at ON translation_history(created_at DESC);

-- Enable RLS
ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own translation history
CREATE POLICY "Users can view own translation history"
    ON translation_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own translation history"
    ON translation_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own translation history"
    ON translation_history FOR DELETE
    USING (auth.uid() = user_id);
