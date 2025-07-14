-- Allow NULL values for assignee_id in tasks table
ALTER TABLE public.tasks ALTER COLUMN assignee_id DROP NOT NULL;

-- Also allow NULL values for creator_id for flexibility
ALTER TABLE public.tasks ALTER COLUMN creator_id DROP NOT NULL;