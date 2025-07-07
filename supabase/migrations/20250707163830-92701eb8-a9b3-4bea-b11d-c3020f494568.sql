-- Add task_id column to time_tracking table
ALTER TABLE public.time_tracking 
ADD COLUMN task_id UUID REFERENCES public.tasks(id);