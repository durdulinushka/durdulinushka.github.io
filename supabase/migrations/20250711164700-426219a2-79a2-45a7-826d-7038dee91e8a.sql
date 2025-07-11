-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL,
  department TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_members table for many-to-many relationship
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, employee_id)
);

-- Add project_id to tasks table
ALTER TABLE public.tasks ADD COLUMN project_id UUID;

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Projects are publicly readable" 
ON public.projects 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update projects" 
ON public.projects 
FOR UPDATE 
USING (true);

-- Create policies for project_members
CREATE POLICY "Project members are publicly readable" 
ON public.project_members 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create project members" 
ON public.project_members 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update project members" 
ON public.project_members 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete project members" 
ON public.project_members 
FOR DELETE 
USING (true);

-- Create trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_employee_id ON public.project_members(employee_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);