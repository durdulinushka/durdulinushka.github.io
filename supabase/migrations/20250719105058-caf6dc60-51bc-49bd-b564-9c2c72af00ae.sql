-- Удаляем записи времени для задачи "Создание задачника" которые создают проблемы с подсчетом
DELETE FROM public.time_tracking 
WHERE id IN ('f6917213-c1b1-4ae2-b084-ff54f9680375', '4e4088b9-3c96-47d3-b73a-2d23564e7baa');

-- Обновляем статус задачи обратно на pending, чтобы можно было заново принять её
UPDATE public.tasks 
SET status = 'pending'
WHERE id = 'd01c68e9-6de2-4f81-b47d-769d4cdee377';