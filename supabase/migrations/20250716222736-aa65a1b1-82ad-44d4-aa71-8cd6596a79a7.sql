-- Add start_date field to tasks table for date range support
ALTER TABLE public.tasks 
ADD COLUMN start_date date;

-- Update existing tasks to have start_date same as planned_date if planned_date exists
UPDATE public.tasks 
SET start_date = planned_date 
WHERE planned_date IS NOT NULL;