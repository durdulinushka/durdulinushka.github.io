-- Добавляем поля для отслеживания просмотренных задач и отчетов
ALTER TABLE tasks 
ADD COLUMN viewed_by jsonb DEFAULT '[]',
ADD COLUMN archived boolean DEFAULT false,
ADD COLUMN archived_at timestamp with time zone;

-- Создаем таблицу для отслеживания просмотров отчетов
CREATE TABLE public.report_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL,
  report_type text NOT NULL, -- 'task', 'time_tracking', etc.
  viewer_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Включаем RLS для report_views
ALTER TABLE public.report_views ENABLE ROW LEVEL SECURITY;

-- Создаем политики для report_views
CREATE POLICY "Report views are publicly readable" 
ON public.report_views 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create report views" 
ON public.report_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update report views" 
ON public.report_views 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete report views" 
ON public.report_views 
FOR DELETE 
USING (true);

-- Создаем индексы для лучшей производительности
CREATE INDEX idx_report_views_report_id ON public.report_views(report_id);
CREATE INDEX idx_report_views_viewer_id ON public.report_views(viewer_id);
CREATE INDEX idx_tasks_archived ON public.tasks(archived);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);