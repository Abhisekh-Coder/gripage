-- Run this in Supabase SQL Editor to allow events without admin_pin
ALTER TABLE events ALTER COLUMN admin_pin SET DEFAULT '';
ALTER TABLE events ALTER COLUMN admin_pin DROP NOT NULL;
