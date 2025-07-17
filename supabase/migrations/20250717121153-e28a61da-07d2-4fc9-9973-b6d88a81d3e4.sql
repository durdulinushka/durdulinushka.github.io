-- Добавить поле project_id в таблицу materials
ALTER TABLE public.materials 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Создать индекс для улучшения производительности
CREATE INDEX idx_materials_project_id ON public.materials(project_id);