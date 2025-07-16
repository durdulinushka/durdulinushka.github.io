-- Удаляем все старые ежедневные задачи с датами, оставляем только шаблонные
DELETE FROM public.tasks 
WHERE task_type = 'daily' 
AND (start_date IS NOT NULL OR due_date IS NOT NULL);

-- Проверяем что остались только шаблонные ежедневные задачи
SELECT COUNT(*) as template_tasks_count 
FROM public.tasks 
WHERE task_type = 'daily' 
AND start_date IS NULL 
AND due_date IS NULL;