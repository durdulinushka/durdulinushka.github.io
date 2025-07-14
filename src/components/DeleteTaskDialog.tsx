import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteTaskDialogProps {
  taskId: string;
  taskTitle: string;
  onTaskDeleted?: () => void;
}

export function DeleteTaskDialog({ taskId, taskTitle, onTaskDeleted }: DeleteTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsLoading(true);

      // Delete task comments
      const { error: commentsError } = await supabase
        .from('task_comments')
        .delete()
        .eq('task_id', taskId);

      if (commentsError) {
        throw new Error(`Ошибка при удалении комментариев: ${commentsError.message}`);
      }

      // Delete task documents
      const { error: documentsError } = await supabase
        .from('task_documents')
        .delete()
        .eq('task_id', taskId);

      if (documentsError) {
        throw new Error(`Ошибка при удалении документов: ${documentsError.message}`);
      }

      // Delete time tracking entries
      const { error: timeTrackingError } = await supabase
        .from('time_tracking')
        .delete()
        .eq('task_id', taskId);

      if (timeTrackingError) {
        throw new Error(`Ошибка при удалении записей времени: ${timeTrackingError.message}`);
      }

      // Delete the task
      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (taskError) {
        throw new Error(`Ошибка при удалении задачи: ${taskError.message}`);
      }

      toast({
        title: "Успешно",
        description: "Задача была удалена",
      });

      onTaskDeleted?.();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить задачу",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Удалить
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить задачу</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить задачу "{taskTitle}"? 
            Это действие нельзя отменить. Все комментарии, документы и записи времени, 
            связанные с этой задачей, также будут удалены.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Удаление..." : "Удалить"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}