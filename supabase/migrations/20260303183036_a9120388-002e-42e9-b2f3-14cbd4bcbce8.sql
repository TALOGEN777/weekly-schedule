
-- Create storage bucket for schedule backups
INSERT INTO storage.buckets (id, name, public) VALUES ('schedule-backups', 'schedule-backups', true);

-- Allow public read access
CREATE POLICY "Public read schedule backups"
ON storage.objects FOR SELECT
USING (bucket_id = 'schedule-backups');

-- Allow public insert
CREATE POLICY "Public insert schedule backups"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'schedule-backups');

-- Allow public delete
CREATE POLICY "Public delete schedule backups"
ON storage.objects FOR DELETE
USING (bucket_id = 'schedule-backups');
