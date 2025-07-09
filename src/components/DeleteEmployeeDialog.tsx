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
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', employeeId);

      if (error) {
        throw error;
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
        description: "Не удалось удалить сотрудника",
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
            Это действие нельзя отменить. Все связанные данные (задачи, отчеты времени) также будут удалены.
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