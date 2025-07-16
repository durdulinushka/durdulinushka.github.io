-- Fix RLS policy for chats table - remove role check
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;

-- Create simpler policy that just checks created_by matches auth.uid()
CREATE POLICY "Users can create chats"
ON public.chats FOR INSERT
WITH CHECK (created_by = auth.uid());