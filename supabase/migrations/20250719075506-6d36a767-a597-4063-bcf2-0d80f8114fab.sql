-- Add overdue status to tasks
-- This will allow tasks to be marked as overdue when their due date has passed

-- First, let's see what task status values we currently have and add overdue as a possibility
-- Since we're using text type, we don't need to modify the column type

-- Create a function to automatically update overdue tasks
CREATE OR REPLACE FUNCTION public.update_overdue_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update tasks that are overdue (due_date < current date and not completed)
  UPDATE public.tasks 
  SET status = 'overdue',
      updated_at = now()
  WHERE due_date < CURRENT_DATE 
    AND status NOT IN ('completed', 'overdue') 
    AND task_type IN ('urgent', 'long-term')
    AND archived = false;
END;
$$;

-- Create a function to get overdue tasks statistics
CREATE OR REPLACE FUNCTION public.get_overdue_stats()
RETURNS TABLE(
  total_overdue bigint,
  overdue_urgent bigint,
  overdue_long_term bigint,
  days_overdue_avg numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_overdue,
    COUNT(*) FILTER (WHERE task_type = 'urgent') as overdue_urgent,
    COUNT(*) FILTER (WHERE task_type = 'long-term') as overdue_long_term,
    AVG(CURRENT_DATE - due_date) as days_overdue_avg
  FROM public.tasks 
  WHERE status = 'overdue' 
    AND archived = false;
END;
$$;