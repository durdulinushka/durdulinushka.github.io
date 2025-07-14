-- Добавляем поле роли в таблицу profiles
ALTER TABLE public.profiles 
ADD COLUMN role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee'));

-- Добавляем индекс для быстрого поиска по ролям
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Добавляем комментарий к колонке
COMMENT ON COLUMN public.profiles.role IS 'Роль пользователя: admin или employee';