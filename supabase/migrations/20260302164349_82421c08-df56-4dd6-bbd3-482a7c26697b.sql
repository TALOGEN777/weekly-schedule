
-- Add week_start column to schedule_rows to scope rows per week
ALTER TABLE public.schedule_rows ADD COLUMN week_start text NOT NULL DEFAULT '';

-- Update existing rows to have empty week_start (they'll be treated as legacy)
