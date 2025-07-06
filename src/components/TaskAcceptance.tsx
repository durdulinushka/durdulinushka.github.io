import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Доступные задачи</CardTitle>
        <CardDescription>
          Выберите задачу для начала работы
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет доступных задач</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
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
              <div className="flex items-center justify-between">
                {task.due_date && (
                  <span className="text-xs text-muted-foreground">
                    Срок: {new Date(task.due_date).toLocaleDateString('ru-RU')}
                  </span>
                )}
                <Button 
                  variant="corporate"
                  size="sm"
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
  );
};

export default TaskAcceptance;