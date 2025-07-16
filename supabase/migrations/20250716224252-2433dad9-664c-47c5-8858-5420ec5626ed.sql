-- Создаем ежедневные задачи-шаблоны с корректным статусом
DO $$
DECLARE 
    sample_profile_id UUID;
    sample_department TEXT;
BEGIN
    -- Получаем первый профиль
    SELECT id, department INTO sample_profile_id, sample_department 
    FROM public.profiles 
    LIMIT 1;
    
    -- Создаем шаблонные ежедневные задачи только если есть профили
    IF sample_profile_id IS NOT NULL THEN
        -- Создаем новые шаблонные ежедневные задачи (они будут служить основой для дублирования)
        INSERT INTO public.tasks (
            title, 
            description, 
            assignee_id, 
            creator_id,
            priority, 
            task_type, 
            start_date,
            due_date,
            department, 
            status
        ) VALUES 
        (
            'Проверка электронной почты', 
            'Ежедневная проверка и обработка входящих писем', 
            sample_profile_id, 
            sample_profile_id,
            'medium', 
            'daily', 
            NULL,
            NULL,
            sample_department, 
            'pending'
        ),
        (
            'Обновление статуса проектов', 
            'Ежедневное обновление прогресса по текущим проектам', 
            sample_profile_id, 
            sample_profile_id,
            'high', 
            'daily', 
            NULL,
            NULL,
            sample_department, 
            'pending'
        ),
        (
            'Планирование рабочего дня', 
            'Составление плана задач на день', 
            sample_profile_id, 
            sample_profile_id,
            'medium', 
            'daily', 
            NULL,
            NULL,
            sample_department, 
            'pending'
        )
        ON CONFLICT DO NOTHING; -- Не создавать дубликаты
    END IF;
END $$;