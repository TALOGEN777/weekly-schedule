
-- Table for schedule rows (rooms/lines)
CREATE TABLE public.schedule_rows (
  id TEXT NOT NULL PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for schedule entries (cells)
CREATE TABLE public.schedule_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  row_id TEXT NOT NULL REFERENCES public.schedule_rows(id) ON DELETE CASCADE,
  date_str TEXT NOT NULL,
  process TEXT NOT NULL DEFAULT '',
  batch TEXT NOT NULL DEFAULT '',
  day TEXT NOT NULL DEFAULT '',
  start_time TEXT NOT NULL DEFAULT '',
  end_time TEXT NOT NULL DEFAULT '',
  employees TEXT NOT NULL DEFAULT '',
  incubator TEXT NOT NULL DEFAULT '',
  hood TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(row_id, date_str)
);

-- Enable RLS
ALTER TABLE public.schedule_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required - shared schedule)
CREATE POLICY "Public read schedule_rows" ON public.schedule_rows FOR SELECT USING (true);
CREATE POLICY "Public insert schedule_rows" ON public.schedule_rows FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update schedule_rows" ON public.schedule_rows FOR UPDATE USING (true);
CREATE POLICY "Public delete schedule_rows" ON public.schedule_rows FOR DELETE USING (true);

CREATE POLICY "Public read schedule_entries" ON public.schedule_entries FOR SELECT USING (true);
CREATE POLICY "Public insert schedule_entries" ON public.schedule_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update schedule_entries" ON public.schedule_entries FOR UPDATE USING (true);
CREATE POLICY "Public delete schedule_entries" ON public.schedule_entries FOR DELETE USING (true);

-- Index for fast lookups by row and date
CREATE INDEX idx_schedule_entries_row_date ON public.schedule_entries(row_id, date_str);
