-- Add DELETE policies for projects, tasks, comments and documents

-- Projects DELETE policy
CREATE POLICY "Users can delete projects" 
ON public.projects 
FOR DELETE 
USING (true);

-- Tasks DELETE policy  
CREATE POLICY "Users can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (true);

-- Task comments DELETE policy
CREATE POLICY "Users can delete task comments" 
ON public.task_comments 
FOR DELETE 
USING (true);

-- Task documents DELETE policy
CREATE POLICY "Users can delete task documents" 
ON public.task_documents 
FOR DELETE 
USING (true);

-- Time tracking DELETE policy (for cleanup when deleting tasks)
CREATE POLICY "Users can delete time tracking" 
ON public.time_tracking 
FOR DELETE 
USING (true);