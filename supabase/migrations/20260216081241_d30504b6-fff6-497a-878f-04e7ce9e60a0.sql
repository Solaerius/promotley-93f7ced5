
-- Table for watched/bookmarked leads and trends from sales radar
CREATE TABLE public.sales_radar_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  result_id uuid NOT NULL REFERENCES public.sales_radar_results(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('lead', 'trend')),
  item_index integer NOT NULL,
  item_title text NOT NULL,
  notify_date date,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_radar_watches ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own watches"
  ON public.sales_radar_watches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watches"
  ON public.sales_radar_watches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watches"
  ON public.sales_radar_watches FOR DELETE
  USING (auth.uid() = user_id);

-- Index for quick lookup
CREATE INDEX idx_sales_radar_watches_user ON public.sales_radar_watches(user_id);
CREATE INDEX idx_sales_radar_watches_result ON public.sales_radar_watches(result_id);
