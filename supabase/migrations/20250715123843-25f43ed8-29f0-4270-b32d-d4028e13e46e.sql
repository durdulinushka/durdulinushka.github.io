-- Создание bucket для материалов
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', false);

-- Создание таблицы materials для управления файлами и доступом
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploader_id UUID NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'department', 'selected_users')),
  department TEXT,
  allowed_users JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включение RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Политики доступа для materials
CREATE POLICY "Materials are viewable based on access settings"
ON public.materials
FOR SELECT
USING (
  access_type = 'public' OR
  (access_type = 'department' AND department = (
    SELECT department FROM profiles WHERE id = auth.uid()
  )) OR
  (access_type = 'selected_users' AND allowed_users ? auth.uid()::text)
);

CREATE POLICY "Users can create materials"
ON public.materials
FOR INSERT
WITH CHECK (uploader_id = auth.uid());

CREATE POLICY "Users can update their own materials"
ON public.materials
FOR UPDATE
USING (uploader_id = auth.uid());

CREATE POLICY "Users can delete their own materials"
ON public.materials
FOR DELETE
USING (uploader_id = auth.uid());

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Политики для storage
CREATE POLICY "Users can upload materials"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view materials based on access settings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'materials' AND
  EXISTS (
    SELECT 1 FROM public.materials m
    WHERE m.file_path = name AND (
      m.access_type = 'public' OR
      (m.access_type = 'department' AND m.department = (
        SELECT department FROM profiles WHERE id = auth.uid()
      )) OR
      (m.access_type = 'selected_users' AND m.allowed_users ? auth.uid()::text)
    )
  )
);

CREATE POLICY "Users can delete their own material files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);