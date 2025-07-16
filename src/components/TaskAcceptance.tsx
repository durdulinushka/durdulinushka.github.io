import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  task_type: string;
  due_date: string | null;
  status: string;
  assignee_id: string;
  department: string;
  completed_at?: string | null;
  total_hours?: number | null;
}

interface TaskAcceptanceProps {
  tasks: Task[];
  onAcceptTask: (task: Task) => void;
}

const TaskAcceptance = ({ tasks, onAcceptTask }: TaskAcceptanceProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-corporate-red';
      case 'medium': return 'bg-corporate-orange';
      case 'low': return 'bg-corporate-green';
      default: return 'bg-muted';
    }
  };

  const formatTime = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const displayHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    if (displayHours > 0) {
      return `${displayHours}ч ${remainingMinutes}м`;
    }
    return `${remainingMinutes}м`;
  };

  const availableTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div className="grid grid-cols-1 gap-8 max-w-none w-full">
      {/* Доступные задачи */}
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Доступные задачи</CardTitle>
          <CardDescription>
            Выберите задачу для начала работы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет доступных задач</p>
          ) : (
            availableTasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-8 min-h-[200px] flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-lg">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge 
                    className={`text-xs ${getPriorityColor(task.priority)} text-white`}
                  >
                    {task.priority === 'high' ? 'Высокий' : 
                     task.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {task.task_type === 'daily' ? 'Ежедневная' :
                     task.task_type === 'long-term' ? 'Долгосрочная' : 'Срочная'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                {task.due_date && (
                  <span className="text-sm text-muted-foreground">
                    Срок: {new Date(task.due_date).toLocaleDateString('ru-RU')}
                  </span>
                )}
                <Button 
                  variant="corporate"
                  size="default"
                  onClick={() => onAcceptTask(task)}
                >
                  Принять задачу
                </Button>
              </div>
            </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Завершенные задачи */}
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Завершенные задачи</CardTitle>
          <CardDescription>
            Недавно выполненные задачи с потраченным временем
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {completedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет завершенных задач</p>
          ) : (
            completedTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-8 min-h-[200px] flex flex-col justify-between opacity-75">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg line-through text-muted-foreground">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-corporate-green text-white text-xs">
                      Выполнено
                    </Badge>
                    <Badge 
                      className={`text-xs ${getPriorityColor(task.priority)} text-white`}
                    >
                      {task.priority === 'high' ? 'Высокий' : 
                       task.priority === 'medium' ? 'Средний' : 'Низкий'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {task.completed_at && (
                      <span>
                        Завершено: {new Date(task.completed_at).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                    {task.total_hours && (
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Потрачено: {formatTime(task.total_hours)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskAcceptance;