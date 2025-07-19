-- Добавляем поддержку статуса 'overdue' для задач
DO $$ 
BEGIN
    -- Проверяем существование constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_status_check' 
        AND table_name = 'tasks'
    ) THEN
        -- Удаляем старый constraint
        ALTER TABLE public.tasks DROP CONSTRAINT tasks_status_check;
    END IF;
    
    -- Добавляем новый constraint с поддержкой 'overdue'
    ALTER TABLE public.tasks 
    ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('pending', 'in-progress', 'completed', 'overdue', 'cancelled'));
    
END $$;