-- ─── Audio Cache Table for R2 CDN Audio Storage ───
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS audio_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text_hash TEXT NOT NULL,
  language TEXT NOT NULL,
  text_preview TEXT,
  r2_url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  page_id TEXT,
  page_title TEXT,
  section TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(text_hash, language)
);

-- Index for fast lookups by text_hash + language
CREATE INDEX IF NOT EXISTS idx_audio_cache_lookup ON audio_cache(text_hash, language);

-- Index for browsing audio by page
CREATE INDEX IF NOT EXISTS idx_audio_cache_page ON audio_cache(page_id);

-- Enable Row Level Security
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;

-- Allow all operations (audio cache is shared across users)
CREATE POLICY "Allow all audio_cache operations" ON audio_cache
  FOR ALL USING (true) WITH CHECK (true);
