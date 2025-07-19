-- Enable pg_cron and pg_net extensions for scheduling
SELECT cron.schedule(
  'update-overdue-tasks-daily',
  '0 6 * * *', -- Каждый день в 6:00 утра
  $$
  SELECT public.update_overdue_tasks();
  $$
);

-- Also create a function to manually trigger the overdue update with statistics refresh
CREATE OR REPLACE FUNCTION public.refresh_overdue_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
  stats_result json;
BEGIN
  -- Update overdue tasks
  PERFORM public.update_overdue_tasks();
  
  -- Get count of updated tasks
  SELECT COUNT(*) INTO updated_count
  FROM public.tasks 
  WHERE status = 'overdue' AND archived = false;
  
  -- Get updated statistics
  SELECT row_to_json(stats) INTO stats_result
  FROM (
    SELECT * FROM public.get_overdue_stats()
  ) stats;
  
  RETURN json_build_object(
    'updated_tasks_count', updated_count,
    'statistics', stats_result
  );
END;
$$;