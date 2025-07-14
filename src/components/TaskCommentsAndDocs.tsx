import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileText, Download, User, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaskComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  task_id: string;
  author?: {
    full_name: string;
    department: string;
  };
}

interface TaskDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  uploader_id: string;
  task_id: string;
  uploader?: {
    full_name: string;
    department: string;
  };
}

interface TaskWithDetails {
  id: string;
  title: string;
  department: string;
  assignee?: {
    full_name: string;
  };
}

const TaskCommentsAndDocs = () => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [documents, setDocuments] = useState<TaskDocument[]>([]);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Загружаем комментарии с информацией об авторах и задачах
      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select(`
          *,
          author:profiles!task_comments_author_id_fkey(full_name, department),
          task:tasks!task_comments_task_id_fkey(title, department, assignee:profiles!tasks_assignee_id_fkey(full_name))
        `)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Загружаем документы с информацией о загрузчиках и задачах
      const { data: documentsData, error: documentsError } = await supabase
        .from('task_documents')
        .select(`
          *,
          uploader:profiles!task_documents_uploader_id_fkey(full_name, department),
          task:tasks!task_documents_task_id_fkey(title, department, assignee:profiles!tasks_assignee_id_fkey(full_name))
        `)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      // Загружаем все задачи для справки
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          department,
          assignee:profiles!tasks_assignee_id_fkey(full_name)
        `);

      if (tasksError) throw tasksError;

      setComments(commentsData || []);
      setDocuments(documentsData || []);
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Неизвестно';
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Комментарий удален",
      });

      loadData(); // Перезагружаем данные
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить комментарий",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('task_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Документ удален",
      });

      loadData(); // Перезагружаем данные
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить документ",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Загрузка данных...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Комментарии к задачам */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Комментарии к задачам
          </CardTitle>
          <CardDescription>
            Все комментарии сотрудников по задачам
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет комментариев</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {(comment as any).author?.full_name || 'Неизвестный автор'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {(comment as any).author?.department || 'Неизвестный отдел'}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-2">
                      Задача: {(comment as any).task?.title || 'Неизвестная задача'}
                    </h4>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteComment(comment.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {new Date(comment.created_at).toLocaleString('ru-RU')}
                  </span>
                  {(comment as any).task?.assignee?.full_name && (
                    <span>
                      Исполнитель: {(comment as any).task.assignee.full_name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Документы по задачам */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Документы по задачам
          </CardTitle>
          <CardDescription>
            Все документы, прикрепленные к задачам
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет документов</p>
          ) : (
            documents.map((document) => (
              <div key={document.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {(document as any).uploader?.full_name || 'Неизвестный автор'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {(document as any).uploader?.department || 'Неизвестный отдел'}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-2">
                      Задача: {(document as any).task?.title || 'Неизвестная задача'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{document.file_name}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadFile(document.file_url, document.file_name)}
                      className="p-2 hover:bg-muted rounded-md transition-colors"
                      title="Скачать файл"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDocument(document.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex gap-4">
                    <span>
                      {new Date(document.created_at).toLocaleString('ru-RU')}
                    </span>
                    <span>
                      Размер: {formatFileSize(document.file_size)}
                    </span>
                    {document.file_type && (
                      <span>
                        Тип: {document.file_type}
                      </span>
                    )}
                  </div>
                  {(document as any).task?.assignee?.full_name && (
                    <span>
                      Исполнитель: {(document as any).task.assignee.full_name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskCommentsAndDocs;