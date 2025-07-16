-- Сначала удаляем связанные записи time_tracking для ежедневных задач с датами
DELETE FROM public.time_tracking 
WHERE task_id IN (
    SELECT id FROM public.tasks 
    WHERE task_type = 'daily' 
    AND (start_date IS NOT NULL OR due_date IS NOT NULL)
);

-- Теперь удаляем ежедневные задачи с датами
DELETE FROM public.tasks 
WHERE task_type = 'daily' 
AND (start_date IS NOT NULL OR due_date IS NOT NULL);