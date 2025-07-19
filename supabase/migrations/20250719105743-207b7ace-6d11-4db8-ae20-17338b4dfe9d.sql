-- Сбрасываем pause_duration для активной задачи "Создание задачника" 
UPDATE public.time_tracking 
SET pause_duration = 0
WHERE id = 'a9370f84-8ba3-4ea9-ba3e-0430c635441a';