-- Drop existing problematic policies
DROP POLICY IF EXISTS "Chat members can view other members" ON public.chat_members;
DROP POLICY IF EXISTS "Chat admins can add members" ON public.chat_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.chat_members;
DROP POLICY IF EXISTS "Chat admins can remove members" ON public.chat_members;

-- Create security definer function to check if user is chat admin
CREATE OR REPLACE FUNCTION public.is_chat_admin(chat_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_members.chat_id = is_chat_admin.chat_id 
    AND chat_members.user_id = is_chat_admin.user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create security definer function to check if user is chat member
CREATE OR REPLACE FUNCTION public.is_chat_member(chat_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_members.chat_id = is_chat_member.chat_id 
    AND chat_members.user_id = is_chat_member.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new non-recursive policies
CREATE POLICY "Anyone can view chat members if they are a member"
ON public.chat_members FOR SELECT
USING (public.is_chat_member(chat_id, auth.uid()));

CREATE POLICY "Users can add themselves as members"
ON public.chat_members FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chat creators can add members"
ON public.chat_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = chat_members.chat_id 
    AND chats.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update their own membership"
ON public.chat_members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can leave chats"
ON public.chat_members FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Chat creators can remove members"
ON public.chat_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = chat_members.chat_id 
    AND chats.created_by = auth.uid()
  )
);