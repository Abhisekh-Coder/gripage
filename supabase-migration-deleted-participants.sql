-- Run this in Supabase SQL Editor
-- Creates archive table for soft-deleted participants

CREATE TABLE IF NOT EXISTS deleted_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  event_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL,
  height_cm REAL NOT NULL,
  weight_kg REAL NOT NULL,
  age INTEGER NOT NULL,
  fitness_does_gym TEXT,
  fitness_gym_frequency TEXT,
  fitness_exercise_types TEXT[],
  fitness_goal TEXT,
  fitness_activity_level TEXT,
  grip_left_kg REAL,
  grip_right_kg REAL,
  grip_avg_kg REAL NOT NULL,
  expected_grip REAL NOT NULL,
  biological_age INTEGER NOT NULL,
  bio_stage TEXT NOT NULL,
  original_created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ DEFAULT now(),
  deleted_by TEXT DEFAULT ''
);

ALTER TABLE deleted_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert deleted_participants" ON deleted_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read deleted_participants" ON deleted_participants FOR SELECT USING (true);
