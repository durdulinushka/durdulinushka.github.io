-- Обновляем существующие задачи, добавляя start_date
-- Для задач с planned_date устанавливаем start_date = planned_date
UPDATE public.tasks 
SET start_date = planned_date 
WHERE planned_date IS NOT NULL AND start_date IS NULL;

-- Для задач с due_date но без planned_date, устанавливаем start_date на день раньше due_date
UPDATE public.tasks 
SET start_date = due_date - INTERVAL '1 day'
WHERE due_date IS NOT NULL AND start_date IS NULL AND planned_date IS NULL;

-- Для задач без дат устанавливаем start_date = сегодня, due_date = сегодня + 1 день (кроме ежедневных)
UPDATE public.tasks 
SET start_date = CURRENT_DATE,
    due_date = CASE 
      WHEN task_type = 'daily' THEN NULL 
      ELSE CURRENT_DATE + INTERVAL '1 day'
    END
WHERE start_date IS NULL AND due_date IS NULL;