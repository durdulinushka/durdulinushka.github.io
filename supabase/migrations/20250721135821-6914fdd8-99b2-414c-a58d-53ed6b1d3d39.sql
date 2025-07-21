-- Добавляем поле worked_time_before_pause в таблицу time_pauses для архивирования времени
ALTER TABLE public.time_pauses 
ADD COLUMN worked_time_before_pause numeric DEFAULT 0;

-- Обновляем существующие записи
UPDATE public.time_pauses 
SET worked_time_before_pause = 0 
WHERE worked_time_before_pause IS NULL;