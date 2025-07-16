-- Create chats table
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'group', -- 'group', 'direct', 'broadcast'
  description TEXT,
  created_by UUID NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_members table
CREATE TABLE public.chat_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'file', 'image'
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  reply_to UUID REFERENCES public.messages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats
CREATE POLICY "Users can view chats they are members of"
ON public.chats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = chats.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create chats"
ON public.chats FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Chat admins can update chats"
ON public.chats FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = chats.id AND user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Chat admins can delete chats"
ON public.chats FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = chats.id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for chat_members
CREATE POLICY "Chat members can view other members"
ON public.chat_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_members cm2
    WHERE cm2.chat_id = chat_members.chat_id AND cm2.user_id = auth.uid()
  )
);

CREATE POLICY "Chat admins can add members"
ON public.chat_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = chat_members.chat_id AND user_id = auth.uid() AND role = 'admin'
  )
  OR
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own membership"
ON public.chat_members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Chat admins can remove members"
ON public.chat_members FOR DELETE
USING (
  user_id = auth.uid() 
  OR
  EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = chat_members.chat_id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for messages
CREATE POLICY "Chat members can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = messages.chat_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Chat members can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = messages.chat_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (sender_id = auth.uid());

-- Create storage bucket for message files
INSERT INTO storage.buckets (id, name, public) VALUES ('message-files', 'message-files', false);

-- Storage policies for message files
CREATE POLICY "Chat members can view message files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'message-files' AND
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.chat_members cm ON m.chat_id = cm.chat_id
    WHERE m.file_url = name AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can upload message files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own message files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'message-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own message files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create indexes for better performance
CREATE INDEX idx_chat_members_user_id ON public.chat_members(user_id);
CREATE INDEX idx_chat_members_chat_id ON public.chat_members(chat_id);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Add triggers for updated_at
CREATE TRIGGER update_chats_updated_at
BEFORE UPDATE ON public.chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live chat
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;