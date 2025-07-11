-- Add foreign key constraints that were missing
ALTER TABLE public.project_members 
ADD CONSTRAINT project_members_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_members 
ADD CONSTRAINT project_members_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;