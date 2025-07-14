import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface DeleteEmployeeDialogProps {
  employeeId: string;
  employeeName: string;
  onEmployeeDeleted?: () => void;
}

export const DeleteEmployeeDialog = ({ employeeId, employeeName, onEmployeeDeleted }: DeleteEmployeeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);

    try {
      // Сначала снимаем назначение задач с удаляемого сотрудника
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ assignee_id: null })
        .eq('assignee_id', employeeId);

      if (tasksError) {
        throw new Error(`Ошибка при обновлении задач: ${tasksError.message}`);
      }

      // Также снимаем назначение задач созданных этим сотрудником
      const { error: creatorTasksError } = await supabase
        .from('tasks')
        .update({ creator_id: null })
        .eq('creator_id', employeeId);

      if (creatorTasksError) {
        throw new Error(`Ошибка при обновлении задач создателя: ${creatorTasksError.message}`);
      }

      // Удаляем записи времени сотрудника
      const { error: timeTrackingError } = await supabase
        .from('time_tracking')
        .delete()
        .eq('employee_id', employeeId);

      if (timeTrackingError) {
        throw new Error(`Ошибка при удалении записей времени: ${timeTrackingError.message}`);
      }

      // Удаляем сотрудника из проектов
      const { error: projectMembersError } = await supabase
        .from('project_members')
        .delete()
        .eq('employee_id', employeeId);

      if (projectMembersError) {
        throw new Error(`Ошибка при удалении из проектов: ${projectMembersError.message}`);
      }

      // Теперь можно безопасно удалить профиль
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', employeeId);

      if (profileError) {
        throw new Error(`Ошибка при удалении профиля: ${profileError.message}`);
      }

      toast({
        title: "Сотрудник удален",
        description: `${employeeName} успешно удален из системы`,
      });

      onEmployeeDeleted?.();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить сотрудника",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить сотрудника</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить <strong>{employeeName}</strong> из системы? 
            Это действие нельзя отменить. Все связанные данные (назначенные задачи, записи времени, участие в проектах) будут удалены или переназначены.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Отмена</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};