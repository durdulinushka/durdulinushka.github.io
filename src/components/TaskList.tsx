import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Bell, File } from "lucide-react";

interface Task {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high';
  type: 'daily' | 'long-term' | 'urgent';
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  description?: string;
  hasDocument?: boolean;
  hasComments?: boolean;
}

interface TaskListProps {
  tasks: Task[];
}

const TaskList = ({ tasks: initialTasks }: TaskListProps) => {
  const [tasks, setTasks] = useState(initialTasks);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-corporate-red';
      case 'medium':
        return 'bg-corporate-orange';
      case 'low':
        return 'bg-corporate-green';
      default:
        return 'bg-muted';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Ежедневная';
      case 'long-term':
        return 'Долгосрочная';
      case 'urgent':
        return 'Срочная';
      default:
        return type;
    }
  };

  const toggleTaskStatus = (taskId: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: task.status === 'completed' ? 'pending' : 'completed' 
          }
        : task
    ));
  };

  const pendingTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Задачи
        </CardTitle>
        <CardDescription>
          Текущие и завершенные задачи
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Активные задачи */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            Активные задачи ({pendingTasks.length})
          </h4>
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет активных задач</p>
          ) : (
            pendingTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.status === 'completed'}
                    onCheckedChange={() => toggleTaskStatus(task.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <label 
                        htmlFor={`task-${task.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {task.title}
                      </label>
                      <div className="flex gap-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(task.priority)} text-white border-transparent`}
                        >
                          {task.priority === 'high' ? 'Высокий' : 
                           task.priority === 'medium' ? 'Средний' : 'Низкий'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(task.type)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Срок: {new Date(task.dueDate).toLocaleDateString('ru-RU')}</span>
                      <div className="flex gap-2">
                        {task.hasDocument && (
                          <span title="Есть документы">
                            <File className="w-3 h-3" />
                          </span>
                        )}
                        {task.hasComments && (
                          <span title="Есть комментарии">
                            <Bell className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Завершенные задачи */}
        {completedTasks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Завершенные задачи ({completedTasks.length})
            </h4>
            {completedTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-3 space-y-2 opacity-75">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`completed-task-${task.id}`}
                    checked={true}
                    onCheckedChange={() => toggleTaskStatus(task.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <label 
                        htmlFor={`completed-task-${task.id}`}
                        className="text-sm font-medium cursor-pointer line-through text-muted-foreground"
                      >
                        {task.title}
                      </label>
                      <Badge className="bg-corporate-green text-xs">
                        Выполнено
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Быстрые действия */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              Добавить комментарий
            </Button>
            <Button variant="outline" size="sm">
              Приложить документ
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskList;