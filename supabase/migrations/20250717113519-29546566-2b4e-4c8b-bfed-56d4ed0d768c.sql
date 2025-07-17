-- Create personal notes table
CREATE TABLE public.personal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT DEFAULT 'yellow',
  reminder_date TIMESTAMP WITH TIME ZONE NULL,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create note files table
CREATE TABLE public.note_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NULL,
  file_type TEXT NULL,
  uploader_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_files ENABLE ROW LEVEL SECURITY;

-- Create policies for personal notes
CREATE POLICY "Users can view their own notes" 
ON public.personal_notes 
FOR SELECT 
USING (auth.uid() = employee_id);

CREATE POLICY "Users can create their own notes" 
ON public.personal_notes 
FOR INSERT 
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update their own notes" 
ON public.personal_notes 
FOR UPDATE 
USING (auth.uid() = employee_id);

CREATE POLICY "Users can delete their own notes" 
ON public.personal_notes 
FOR DELETE 
USING (auth.uid() = employee_id);

-- Create policies for note files
CREATE POLICY "Users can view files of their own notes" 
ON public.note_files 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.personal_notes 
  WHERE personal_notes.id = note_files.note_id 
  AND personal_notes.employee_id = auth.uid()
));

CREATE POLICY "Users can create files for their own notes" 
ON public.note_files 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploader_id AND
  EXISTS (
    SELECT 1 FROM public.personal_notes 
    WHERE personal_notes.id = note_files.note_id 
    AND personal_notes.employee_id = auth.uid()
  )
);

CREATE POLICY "Users can delete files of their own notes" 
ON public.note_files 
FOR DELETE 
USING (
  auth.uid() = uploader_id AND
  EXISTS (
    SELECT 1 FROM public.personal_notes 
    WHERE personal_notes.id = note_files.note_id 
    AND personal_notes.employee_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_personal_notes_updated_at
BEFORE UPDATE ON public.personal_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for note files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-files', 'note-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for note files
CREATE POLICY "Users can view their own note files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'note-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own note files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'note-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own note files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'note-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);