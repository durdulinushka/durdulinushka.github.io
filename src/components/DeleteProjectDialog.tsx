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

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  onProjectDeleted?: () => void;
}

export function DeleteProjectDialog({ projectId, projectName, onProjectDeleted }: DeleteProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsLoading(true);

      // Delete project members first
      const { error: membersError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId);

      if (membersError) {
        throw new Error(`Ошибка при удалении участников проекта: ${membersError.message}`);
      }

      // Update tasks to remove project reference
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ project_id: null })
        .eq('project_id', projectId);

      if (tasksError) {
        throw new Error(`Ошибка при обновлении задач: ${tasksError.message}`);
      }

      // Delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (projectError) {
        throw new Error(`Ошибка при удалении проекта: ${projectError.message}`);
      }

      toast({
        title: "Успешно",
        description: "Проект был удален",
      });

      onProjectDeleted?.();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить проект",
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
          <AlertDialogTitle>Удалить проект</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить проект "{projectName}"? 
            Это действие нельзя отменить. Все участники будут удалены из проекта, 
            а связанные задачи останутся, но потеряют связь с проектом.
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