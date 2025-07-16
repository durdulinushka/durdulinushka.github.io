-- Drop existing problematic policies for chats
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Chat admins can update chats" ON public.chats;
DROP POLICY IF EXISTS "Chat admins can delete chats" ON public.chats;

-- Create new correct policies for chats
CREATE POLICY "Authenticated users can create chats"
ON public.chats FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

CREATE POLICY "Chat creators can update their chats"
ON public.chats FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Chat creators can delete their chats"
ON public.chats FOR DELETE
USING (created_by = auth.uid());