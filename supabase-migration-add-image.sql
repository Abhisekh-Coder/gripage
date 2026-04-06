-- Run this in Supabase SQL Editor to add image support
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';

-- Create storage bucket for event images (run in Supabase dashboard > Storage)
-- Or use this SQL:
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to the bucket
CREATE POLICY "Allow public upload event images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-images');
CREATE POLICY "Allow public read event images" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');
