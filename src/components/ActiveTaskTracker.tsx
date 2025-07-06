import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Pause, Check } from "lucide-react";

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

interface ActiveTaskTrackerProps {
  currentTask: Task;
  workStatus: 'working' | 'paused';
  workedTime: number;
  dailyHours: number;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
}

const ActiveTaskTracker = ({ 
  currentTask, 
  workStatus, 
  workedTime, 
  dailyHours,
  onPause, 
  onResume, 
  onFinish 
}: ActiveTaskTrackerProps) => {
  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-corporate-red';
      case 'medium': return 'bg-corporate-orange';
      case 'low': return 'bg-corporate-green';
      default: return 'bg-muted';
    }
  };

  const getStatusBadge = () => {
    switch (workStatus) {
      case 'working':
        return <Badge className="bg-corporate-green">В работе</Badge>;
      case 'paused':
        return <Badge className="bg-corporate-orange">На паузе</Badge>;
      default:
        return null;
    }
  };

  const dailyTarget = dailyHours * 60 * 60 * 1000;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Работа над: {currentTask.title}
            </CardTitle>
            <CardDescription>
              {currentTask.description}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Текущая задача */}
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium">{currentTask.title}</h4>
            <Badge 
              className={`text-xs ${getPriorityColor(currentTask.priority)} text-white`}
            >
              {currentTask.priority === 'high' ? 'Высокий' : 
               currentTask.priority === 'medium' ? 'Средний' : 'Низкий'}
            </Badge>
          </div>
          {currentTask.description && (
            <p className="text-sm text-muted-foreground">{currentTask.description}</p>
          )}
          {currentTask.due_date && (
            <p className="text-xs text-muted-foreground">
              Срок: {new Date(currentTask.due_date).toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>

        {/* Таймер */}
        <div className="text-center">
          <div className="text-4xl font-bold text-corporate-blue mb-2">
            {formatTime(workedTime)}
          </div>
          <div className="text-sm text-muted-foreground">
            Цель: {dailyHours} часов ({formatTime(dailyTarget)})
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex gap-2">
          {workStatus === 'working' && (
            <>
              <Button 
                variant="warning" 
                className="flex-1"
                onClick={onPause}
              >
                <Pause className="w-4 h-4 mr-2" />
                Пауза
              </Button>
              <Button 
                variant="success" 
                onClick={onFinish}
              >
                <Check className="w-4 h-4 mr-2" />
                Завершить задачу
              </Button>
            </>
          )}

          {workStatus === 'paused' && (
            <>
              <Button 
                variant="corporate" 
                className="flex-1"
                onClick={onResume}
              >
                Продолжить работу
              </Button>
              <Button 
                variant="success" 
                onClick={onFinish}
              >
                <Check className="w-4 h-4 mr-2" />
                Завершить задачу
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveTaskTracker;