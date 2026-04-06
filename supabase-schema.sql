-- GripAge Database Schema
-- Run this in Supabase SQL Editor

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  admin_pin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  height_cm REAL NOT NULL,
  weight_kg REAL NOT NULL,
  age INTEGER NOT NULL,
  fitness_does_gym TEXT NOT NULL DEFAULT 'sometimes',
  fitness_gym_frequency TEXT NOT NULL DEFAULT '',
  fitness_exercise_types TEXT[] NOT NULL DEFAULT '{}',
  fitness_goal TEXT NOT NULL DEFAULT 'Stay Healthy',
  fitness_activity_level TEXT NOT NULL DEFAULT 'moderate',
  grip_left_kg REAL,
  grip_right_kg REAL,
  grip_avg_kg REAL NOT NULL,
  expected_grip REAL NOT NULL,
  biological_age INTEGER NOT NULL,
  bio_stage TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_bio_age ON participants(biological_age);
CREATE INDEX IF NOT EXISTS idx_events_code ON events(code);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (for event app - no auth needed)
CREATE POLICY "Allow public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update events" ON events FOR UPDATE USING (true);

CREATE POLICY "Allow public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Allow public insert participants" ON participants FOR INSERT WITH CHECK (true);
