-- Проверим оставшиеся шаблонные задачи
SELECT id, title, task_type, start_date, due_date, status
FROM public.tasks 
WHERE task_type = 'daily';