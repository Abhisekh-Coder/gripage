-- Run this in Supabase SQL Editor to add description, location, duration to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS duration TEXT NOT NULL DEFAULT '';
