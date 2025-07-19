import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'daily' | 'long-term' | 'urgent';
  start_date: string | null;
  due_date: string | null;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  department: string;
}

interface Profile {
  id: string;
  full_name: string;
  department: string;
  position: string;
}

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  profiles: Profile[];
}

export const EditTaskDialog = ({ 
  task, 
  open, 
  onOpenChange, 
  onUpdate, 
  profiles 
}: EditTaskDialogProps) => {
  const [editedTask, setEditedTask] = useState({
    title: "",
    description: "",
    assignee_id: "",
    priority: "medium",
    task_type: "daily",
    start_date: "",
    due_date: "",
    department: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description || "",
        assignee_id: task.assignee_id,
        priority: task.priority,
        task_type: task.task_type,
        start_date: task.start_date || "",
        due_date: task.due_date || "",
        department: task.department
      });
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !editedTask.title || !editedTask.assignee_id) {
      toast({ 
        title: "Ошибка", 
        description: "Заполните все обязательные поля", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const selectedProfile = profiles.find(p => p.id === editedTask.assignee_id);
      
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editedTask.title,
          description: editedTask.description,
          assignee_id: editedTask.assignee_id,
          priority: editedTask.priority,
          task_type: editedTask.task_type,
          start_date: editedTask.start_date || null,
          due_date: editedTask.due_date || null,
          department: selectedProfile?.department || editedTask.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({ 
        title: "Успешно", 
        description: "Задача обновлена" 
      });
      
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось обновить задачу", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Редактировать задачу</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input 
            placeholder="Название задачи" 
            value={editedTask.title}
            onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
          />
          
          <Textarea 
            placeholder="Описание задачи" 
            value={editedTask.description}
            onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
            rows={3}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              value={editedTask.assignee_id} 
              onValueChange={(value) => setEditedTask({...editedTask, assignee_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Исполнитель" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name} - {profile.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={editedTask.priority} 
              onValueChange={(value) => setEditedTask({...editedTask, priority: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Приоритет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="low">Низкий</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              value={editedTask.task_type} 
              onValueChange={(value) => setEditedTask({...editedTask, task_type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Тип задачи" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Срочная</SelectItem>
                <SelectItem value="daily">Ежедневная</SelectItem>
                <SelectItem value="long-term">Долгосрочная</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <label className="text-sm font-medium">Срок выполнения</label>
              <Input 
                type="date" 
                placeholder="Срок выполнения" 
                value={editedTask.due_date}
                onChange={(e) => setEditedTask({...editedTask, due_date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Начало периода выполнения</label>
              <Input 
                type="date" 
                placeholder="Дата начала" 
                value={editedTask.start_date}
                onChange={(e) => setEditedTask({...editedTask, start_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Окончание периода выполнения</label>
              <Input 
                type="date" 
                placeholder="Дата окончания" 
                value={editedTask.due_date}
                onChange={(e) => setEditedTask({...editedTask, due_date: e.target.value})}
              />
            </div>
          </div>

          <Input 
            placeholder="Отдел" 
            value={editedTask.department}
            onChange={(e) => setEditedTask({...editedTask, department: e.target.value})}
          />

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button 
              variant="corporate" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};