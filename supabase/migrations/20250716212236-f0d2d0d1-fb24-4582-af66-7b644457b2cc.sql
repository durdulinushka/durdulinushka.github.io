-- Полностью пересоздаем RLS политики для chats
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Chat creators can update their chats" ON public.chats;
DROP POLICY IF EXISTS "Chat creators can delete their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view chats they are members of" ON public.chats;

-- Отключаем RLS временно для теста
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;

-- Включаем RLS обратно
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Создаем новые простые политики
CREATE POLICY "Enable insert for authenticated users only" 
ON public.chats FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users only" 
ON public.chats FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable update for authenticated users only" 
ON public.chats FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Enable delete for authenticated users only" 
ON public.chats FOR DELETE 
TO authenticated 
USING (true);