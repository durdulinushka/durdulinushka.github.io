import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, Clock, Upload, Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  color: string;
  reminder_date: string | null;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

interface NoteFile {
  id: string;
  note_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

const COLORS = [
  { value: 'yellow', label: 'Жёлтый', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { value: 'pink', label: 'Розовый', bg: 'bg-pink-100', border: 'border-pink-300' },
  { value: 'blue', label: 'Синий', bg: 'bg-blue-100', border: 'border-blue-300' },
  { value: 'green', label: 'Зелёный', bg: 'bg-green-100', border: 'border-green-300' },
  { value: 'purple', label: 'Фиолетовый', bg: 'bg-purple-100', border: 'border-purple-300' },
];

export const PersonalNotes = () => {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [noteFiles, setNoteFiles] = useState<Record<string, NoteFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<PersonalNote | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [reminderNote, setReminderNote] = useState<PersonalNote | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: 'yellow',
    reminder_date: ''
  });
  const { toast } = useToast();

  // Функция для воспроизведения звука напоминания
  const playReminderSound = () => {
    try {
      // Создаем простой звуковой сигнал используя Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (error) {
      console.warn('Не удалось воспроизвести звук напоминания:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('personal_notes')
        .select('*')
        .eq('employee_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);

      // Загружаем файлы для каждой заметки
      if (data && data.length > 0) {
        const noteIds = data.map(note => note.id);
        const { data: filesData, error: filesError } = await supabase
          .from('note_files')
          .select('*')
          .in('note_id', noteIds);

        if (filesError) throw filesError;

        // Группируем файлы по note_id
        const groupedFiles: Record<string, NoteFile[]> = {};
        filesData?.forEach(file => {
          if (!groupedFiles[file.note_id]) {
            groupedFiles[file.note_id] = [];
          }
          groupedFiles[file.note_id].push(file);
        });
        setNoteFiles(groupedFiles);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заметки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Конвертируем локальное время в UTC для сохранения
      let reminderDateUTC = null;
      if (newNote.reminder_date) {
        const localDate = new Date(newNote.reminder_date);
        reminderDateUTC = localDate.toISOString();
      }

      const { error } = await supabase
        .from('personal_notes')
        .insert({
          employee_id: user.user.id,
          title: newNote.title,
          content: newNote.content,
          color: newNote.color,
          reminder_date: reminderDateUTC
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Заметка создана",
      });

      setNewNote({ title: '', content: '', color: 'yellow', reminder_date: '' });
      setIsCreateDialogOpen(false);
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заметку",
        variant: "destructive",
      });
    }
  };

  const updateNote = async () => {
    if (!selectedNote) return;

    try {
      // Конвертируем локальное время в UTC для сохранения
      let reminderDateUTC = selectedNote.reminder_date;
      if (selectedNote.reminder_date && !selectedNote.reminder_date.includes('T')) {
        // Если это локальное время из input
        const localDate = new Date(selectedNote.reminder_date);
        reminderDateUTC = localDate.toISOString();
      }

      const { error } = await supabase
        .from('personal_notes')
        .update({
          title: selectedNote.title,
          content: selectedNote.content,
          color: selectedNote.color,
          reminder_date: reminderDateUTC
        })
        .eq('id', selectedNote.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Заметка обновлена",
      });

      setIsEditDialogOpen(false);
      setSelectedNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заметку",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('personal_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Заметка удалена",
      });

      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заметку",
        variant: "destructive",
      });
    }
  };

  const uploadFile = async (noteId: string, file: File) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Загружаем файл в storage
      const filePath = `${user.user.id}/${noteId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('note-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Сохраняем информацию о файле в базе данных
      const { error: dbError } = await supabase
        .from('note_files')
        .insert({
          note_id: noteId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploader_id: user.user.id
        });

      if (dbError) throw dbError;

      toast({
        title: "Успешно",
        description: "Файл загружен",
      });

      fetchNotes();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (file: NoteFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('note-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось скачать файл",
        variant: "destructive",
      });
    }
  };

  const deleteFile = async (file: NoteFile) => {
    try {
      // Удаляем файл из storage
      const { error: storageError } = await supabase.storage
        .from('note-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Удаляем запись из базы данных
      const { error: dbError } = await supabase
        .from('note_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: "Успешно",
        description: "Файл удалён",
      });

      fetchNotes();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить файл",
        variant: "destructive",
      });
    }
  };

  const getColorClasses = (color: string) => {
    const colorConfig = COLORS.find(c => c.value === color);
    return colorConfig ? `${colorConfig.bg} ${colorConfig.border}` : 'bg-yellow-100 border-yellow-300';
  };

  // Проверка напоминаний
  const checkReminders = () => {
    const now = new Date();
    notes.forEach(note => {
      if (note.reminder_date) {
        const reminderTime = new Date(note.reminder_date);
        const timeDiff = reminderTime.getTime() - now.getTime();
        
        // Показываем напоминание если время наступило (в пределах 1 минуты)
        if (timeDiff <= 60000 && timeDiff > -60000) {
          // Воспроизводим звук
          playReminderSound();
          
          // Показываем всплывающее окно
          setReminderNote(note);
          setIsReminderDialogOpen(true);
          
          // Дополнительно показываем toast
          toast({
            title: "Напоминание",
            description: `${note.title}: ${note.content}`,
            duration: 10000,
          });
        }
      }
    });
  };

  // Функция для конвертации UTC времени в локальное для input
  const formatDateTimeForInput = (utcDateString: string | null) => {
    if (!utcDateString) return '';
    const date = new Date(utcDateString);
    // Получаем локальное время и форматируем для datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    // Проверяем напоминания каждую минуту
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [notes]);

  if (loading) {
    return <div className="flex justify-center p-8">Загрузка заметок...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Личные заметки</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Добавить заметку
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая заметка</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Заголовок</Label>
                <Input
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Введите заголовок заметки"
                />
              </div>
              <div>
                <Label htmlFor="content">Содержание</Label>
                <Textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Введите текст заметки"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="color">Цвет</Label>
                <Select value={newNote.color} onValueChange={(value) => setNewNote({ ...newNote, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.bg} ${color.border} border`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reminder">Напоминание</Label>
                <Input
                  id="reminder"
                  type="datetime-local"
                  value={newNote.reminder_date}
                  onChange={(e) => setNewNote({ ...newNote, reminder_date: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createNote} disabled={!newNote.title.trim()}>
                  Создать
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {notes.map((note) => (
          <Card 
            key={note.id} 
            className={`${getColorClasses(note.color)} border-2 cursor-pointer hover:shadow-lg transition-shadow`}
            onClick={() => {
              setSelectedNote(note);
              setIsEditDialogOpen(true);
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium line-clamp-2">
                  {note.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-600 line-clamp-3 mb-2">
                {note.content}
              </p>
              
              <div className="space-y-2">
                {note.reminder_date && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(note.reminder_date), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </Badge>
                )}
                
                {noteFiles[note.id] && noteFiles[note.id].length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    {noteFiles[note.id].length} файл(ов)
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-gray-400 mt-2">
                {format(new Date(note.created_at), 'dd.MM.yyyy', { locale: ru })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Диалог редактирования заметки */}
      {selectedNote && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редактировать заметку</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Заголовок</Label>
                <Input
                  id="edit-title"
                  value={selectedNote.title}
                  onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-content">Содержание</Label>
                <Textarea
                  id="edit-content"
                  value={selectedNote.content || ''}
                  onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Цвет</Label>
                <Select 
                  value={selectedNote.color} 
                  onValueChange={(value) => setSelectedNote({ ...selectedNote, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.bg} ${color.border} border`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-reminder">Напоминание</Label>
                <Input
                  id="edit-reminder"
                  type="datetime-local"
                  value={formatDateTimeForInput(selectedNote.reminder_date)}
                  onChange={(e) => setSelectedNote({ ...selectedNote, reminder_date: e.target.value || null })}
                />
              </div>

              {/* Файлы */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Файлы</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) {
                          Array.from(files).forEach(file => {
                            uploadFile(selectedNote.id, file);
                          });
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Загрузить файл
                  </Button>
                </div>
                
                {noteFiles[selectedNote.id] && noteFiles[selectedNote.id].length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                    {noteFiles[selectedNote.id].map((file) => (
                      <div key={file.id} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{file.file_name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(file)}
                            className="h-6 w-6 p-0"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFile(file)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={updateNote}>
                  Сохранить
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedNote(null);
                }}>
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {notes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>У вас пока нет заметок</p>
          <p className="text-sm">Создайте первую заметку, чтобы начать</p>
        </div>
      )}

      {/* Всплывающее окно напоминания */}
      <AlertDialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Напоминание
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-foreground">{reminderNote?.title}</h3>
                <p className="text-muted-foreground">{reminderNote?.content}</p>
                {reminderNote?.reminder_date && (
                  <p className="text-sm text-muted-foreground">
                    Время: {format(new Date(reminderNote.reminder_date), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsReminderDialogOpen(false)}>
              Понятно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};