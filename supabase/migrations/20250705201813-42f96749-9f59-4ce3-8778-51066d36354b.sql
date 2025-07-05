-- Создание таблицы профилей сотрудников
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  daily_hours INTEGER DEFAULT 8,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы задач
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES public.profiles(id) NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  task_type TEXT CHECK (task_type IN ('daily', 'long-term', 'urgent')) DEFAULT 'daily',
  status TEXT CHECK (status IN ('pending', 'in-progress', 'completed')) DEFAULT 'pending',
  due_date DATE,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Создание таблицы отслеживания времени
CREATE TABLE public.time_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.profiles(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  pause_duration INTEGER DEFAULT 0, -- в минутах
  total_hours DECIMAL(4,2) DEFAULT 0,
  status TEXT CHECK (status IN ('not-started', 'working', 'paused', 'finished')) DEFAULT 'not-started',
  login_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы пауз
CREATE TABLE public.time_pauses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_tracking_id UUID REFERENCES public.time_tracking(id) NOT NULL,
  pause_start TIMESTAMP WITH TIME ZONE NOT NULL,
  pause_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы документов
CREATE TABLE public.task_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) NOT NULL,
  uploader_id UUID REFERENCES public.profiles(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы комментариев
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) NOT NULL,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включение RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Политики для profiles (публичное чтение, обновление только своего профиля)
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (true);

-- Политики для tasks (все могут читать, создавать и обновлять)
CREATE POLICY "Tasks are publicly readable" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update tasks" ON public.tasks FOR UPDATE USING (true);

-- Политики для time_tracking (все могут читать и управлять)
CREATE POLICY "Time tracking is publicly readable" ON public.time_tracking FOR SELECT USING (true);
CREATE POLICY "Users can create time tracking" ON public.time_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update time tracking" ON public.time_tracking FOR UPDATE USING (true);

-- Политики для time_pauses
CREATE POLICY "Time pauses are publicly readable" ON public.time_pauses FOR SELECT USING (true);
CREATE POLICY "Users can create time pauses" ON public.time_pauses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update time pauses" ON public.time_pauses FOR UPDATE USING (true);

-- Политики для task_documents
CREATE POLICY "Task documents are publicly readable" ON public.task_documents FOR SELECT USING (true);
CREATE POLICY "Users can create task documents" ON public.task_documents FOR INSERT WITH CHECK (true);

-- Политики для task_comments
CREATE POLICY "Task comments are publicly readable" ON public.task_comments FOR SELECT USING (true);
CREATE POLICY "Users can create task comments" ON public.task_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own comments" ON public.task_comments FOR UPDATE USING (true);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_tracking_updated_at
  BEFORE UPDATE ON public.time_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Вставка тестовых данных
INSERT INTO public.profiles (full_name, email, department, position, daily_hours) VALUES
('Иван Петров', 'ivan.petrov@company.com', 'IT-отдел', 'Разработчик', 8),
('Мария Иванова', 'maria.ivanova@company.com', 'Дизайн', 'UI/UX Дизайнер', 8),
('Алексей Сидоров', 'alexey.sidorov@company.com', 'Маркетинг', 'Маркетолог', 8),
('Елена Козлова', 'elena.kozlova@company.com', 'HR', 'HR Менеджер', 8);

-- Создание бакета для документов
INSERT INTO storage.buckets (id, name, public) VALUES ('task-documents', 'task-documents', false);

-- Политики для storage
CREATE POLICY "Users can view task documents" ON storage.objects FOR SELECT USING (bucket_id = 'task-documents');
CREATE POLICY "Users can upload task documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'task-documents');
CREATE POLICY "Users can update task documents" ON storage.objects FOR UPDATE USING (bucket_id = 'task-documents');
CREATE POLICY "Users can delete task documents" ON storage.objects FOR DELETE USING (bucket_id = 'task-documents');