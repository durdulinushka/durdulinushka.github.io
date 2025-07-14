-- Add foreign key constraint with CASCADE for time_tracking table
ALTER TABLE public.time_tracking 
DROP CONSTRAINT IF EXISTS time_tracking_employee_id_fkey;

ALTER TABLE public.time_tracking 
ADD CONSTRAINT time_tracking_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;