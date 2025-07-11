import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Project } from "./ProjectManagement";

interface ProjectMember {
  id: string;
  employee_id: string;
  profiles: {
    full_name: string;
    position: string;
  };
}

interface AddProjectTaskDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskAdded: () => void;
}

export const AddProjectTaskDialog = ({ 
  project, 
  open, 
  onOpenChange, 
  onTaskAdded 
}: AddProjectTaskDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignee_id: "",
    planned_date: "",
    due_date: "",
  });
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProjectMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          id,
          employee_id,
          profiles:project_members_employee_id_fkey (
            full_name,
            position
          )
        `)
        .eq('project_id', project.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProjectMembers();
    }
  }, [open, project.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.assignee_id) {
      toast({
        title: "Ошибка",
        description: "Заполните обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          priority: formData.priority,
          assignee_id: formData.assignee_id,
          creator_id: 'current-user', // TODO: Replace with actual user ID
          department: project.department,
          project_id: project.id,
          planned_date: formData.planned_date || null,
          due_date: formData.due_date || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Задача создана",
      });

      setFormData({
        title: "",
        description: "",
        priority: "medium",
        assignee_id: "",
        planned_date: "",
        due_date: "",
      });
      onTaskAdded();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Создать задачу в проекте: {project.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название задачи *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Разработка прототипа"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Детальное описание задачи..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Исполнитель *</Label>
              <Select
                value={formData.assignee_id}
                onValueChange={(value) => setFormData({ ...formData, assignee_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите исполнителя" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.employee_id} value={member.employee_id}>
                      {member.profiles.full_name} - {member.profiles.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planned_date">Дата планирования</Label>
              <Input
                id="planned_date"
                type="date"
                value={formData.planned_date}
                onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Срок выполнения</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || members.length === 0}>
              {loading ? "Создание..." : "Создать задачу"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};