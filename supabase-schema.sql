-- ═══════════════════════════════════════════════════════════
-- LangoWorld Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Summaries table (all video summaries)
CREATE TABLE public.summaries (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    video_url TEXT NOT NULL,
    video_title TEXT NOT NULL,
    channel TEXT DEFAULT '',
    summary TEXT DEFAULT '',
    key_points JSONB DEFAULT '[]',
    explanation TEXT DEFAULT '',
    tts_summary TEXT DEFAULT '',
    transcript TEXT DEFAULT '',
    chapters JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations table
CREATE TABLE public.translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    summary_id TEXT REFERENCES public.summaries(id) ON DELETE CASCADE NOT NULL,
    language TEXT NOT NULL,
    translated_data JSONB DEFAULT '{}',
    translated_transcript TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(summary_id, language)
);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all (for username uniqueness), update own
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Summaries: users can CRUD their own
CREATE POLICY "Users can view own summaries" ON public.summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON public.summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own summaries" ON public.summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own summaries" ON public.summaries FOR DELETE USING (auth.uid() = user_id);

-- Translations: users can CRUD via summary ownership
CREATE POLICY "Users can view own translations" ON public.translations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.summaries WHERE summaries.id = translations.summary_id AND summaries.user_id = auth.uid()));
CREATE POLICY "Users can insert own translations" ON public.translations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.summaries WHERE summaries.id = translations.summary_id AND summaries.user_id = auth.uid()));
CREATE POLICY "Users can update own translations" ON public.translations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.summaries WHERE summaries.id = translations.summary_id AND summaries.user_id = auth.uid()));
CREATE POLICY "Users can delete own translations" ON public.translations FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.summaries WHERE summaries.id = translations.summary_id AND summaries.user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════

CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_summaries_user_id ON public.summaries(user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
