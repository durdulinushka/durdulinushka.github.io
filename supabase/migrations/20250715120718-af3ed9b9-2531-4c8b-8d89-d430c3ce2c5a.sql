-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "Departments are publicly readable" 
ON public.departments 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage departments" 
ON public.departments 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default departments
INSERT INTO public.departments (name, description) VALUES 
('Не указан', 'Отдел по умолчанию'),
('IT', 'Информационные технологии'),
('HR', 'Отдел кадров'),
('Финансы', 'Финансовый отдел'),
('Маркетинг', 'Отдел маркетинга'),
('Продажи', 'Отдел продаж');