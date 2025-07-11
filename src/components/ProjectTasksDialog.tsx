import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Project } from "./ProjectManagement";
import { AddProjectTaskDialog } from "./AddProjectTaskDialog";

interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  planned_date?: string;
  due_date?: string;
  assignee_id: string;
  project_id: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ProjectTasksDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onUpdate: () => void;
}

export const ProjectTasksDialog = ({ 
  project, 
  open, 
  onOpenChange, 
  isAdmin, 
  onUpdate 
}: ProjectTasksDialogProps) => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles:tasks_assignee_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить задачи проекта",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTasks();
    }
  }, [open, project.id]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершена';
      default: return status;
    }
  };

  const handleTaskAdded = () => {
    fetchTasks();
    setShowAddDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Задачи проекта: {project.name}</DialogTitle>
              {isAdmin && (
                <Button
                  onClick={() => setShowAddDialog(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить задачу
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>В проекте пока нет задач</p>
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(true)}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Создать первую задачу
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityText(task.priority)}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusText(task.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{task.profiles.full_name}</span>
                      </div>
                      {task.planned_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Запланировано: {format(new Date(task.planned_date), 'd MMM yyyy', { locale: ru })}
                          </span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Срок: {format(new Date(task.due_date), 'd MMM yyyy', { locale: ru })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddProjectTaskDialog
        project={project}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onTaskAdded={handleTaskAdded}
      />
    </>
  );
};