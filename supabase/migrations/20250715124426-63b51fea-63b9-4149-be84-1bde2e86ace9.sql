-- Добавление foreign key constraint между materials и profiles
ALTER TABLE public.materials 
ADD CONSTRAINT materials_uploader_id_fkey 
FOREIGN KEY (uploader_id) REFERENCES public.profiles(id) ON DELETE CASCADE;