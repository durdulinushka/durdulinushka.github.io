-- Enable DELETE operations for profiles table
CREATE POLICY "Users can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (true);