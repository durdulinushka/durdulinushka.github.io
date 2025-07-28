import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddPersonalTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskAdded: () => void;
  employeeId: string;
}

export const AddPersonalTaskDialog = ({ open, onOpenChange, onTaskAdded, employeeId }: AddPersonalTaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskType, setTaskType] = useState<'daily' | 'long-term' | 'urgent'>('daily');
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Ошибка",
        description: "Название задачи не может быть пустым",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Получаем данные сотрудника
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('department')
        .eq('id', employeeId)
        .single();

      if (profileError) throw profileError;

      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: title.trim(),
          description: description.trim() || null,
          assignee_id: employeeId,
          creator_id: employeeId,
          priority,
          task_type: taskType,
          due_date: dueDate || null,
          department: profile.department,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Личная задача создана успешно"
      });

      // Сброс формы
      setTitle("");
      setDescription("");
      setPriority('medium');
      setTaskType('daily');
      setDueDate("");
      
      onTaskAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating personal task:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'Ежедневная';
      case 'long-term': return 'Долгосрочная';
      case 'urgent': return 'Срочная';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Создать личную задачу</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Название задачи *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название задачи"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Описание
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите задачу подробнее"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Приоритет
              </label>
              <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{getPriorityLabel('low')}</SelectItem>
                  <SelectItem value="medium">{getPriorityLabel('medium')}</SelectItem>
                  <SelectItem value="high">{getPriorityLabel('high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Тип задачи
              </label>
              <Select value={taskType} onValueChange={(value: 'daily' | 'long-term' | 'urgent') => setTaskType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{getTypeLabel('daily')}</SelectItem>
                  <SelectItem value="long-term">{getTypeLabel('long-term')}</SelectItem>
                  <SelectItem value="urgent">{getTypeLabel('urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Дедлайн
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Создание..." : "Создать задачу"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};