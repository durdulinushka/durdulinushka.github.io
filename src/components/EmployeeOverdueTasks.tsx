import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EmployeeOverdueTasksProps {
  employeeId?: string;
}

interface OverdueTask {
  id: string;
  title: string;
  description?: string;
  priority: string;
  task_type: string;
  due_date: string;
  department: string;
  days_overdue: number;
}

const EmployeeOverdueTasks = ({ employeeId }: EmployeeOverdueTasksProps) => {
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchOverdueTasks();
    }
  }, [employeeId]);

  const fetchOverdueTasks = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      // Обновляем просроченные задачи перед загрузкой
      await supabase.rpc('update_overdue_tasks');

      // Получаем просроченные задачи для конкретного сотрудника
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          priority,
          task_type,
          due_date,
          department
        `)
        .eq('status', 'overdue')
        .eq('assignee_id', employeeId)
        .eq('archived', false)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Преобразуем данные с расчетом дней просрочки
      const transformedTasks: OverdueTask[] = (data || []).map(task => {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          task_type: task.task_type,
          due_date: task.due_date,
          department: task.department,
          days_overdue: daysOverdue
        };
      });

      setOverdueTasks(transformedTasks);
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      // Обновляем список задач
      fetchOverdueTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'Срочная';
      case 'long-term':
        return 'Долгосрочная';
      default:
        return type;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return priority;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (overdueTasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-green-600 mb-2">
            <Clock className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="font-medium text-lg mb-2">Нет просроченных задач</h3>
          <p className="text-muted-foreground">Все ваши задачи выполнены в срок!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Просроченные задачи ({overdueTasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {overdueTasks.map((task) => (
            <Card key={task.id} className="border-red-200 bg-white">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                        {getTypeLabel(task.task_type)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-500" />
                      <span className="text-red-700">
                        Срок: {format(new Date(task.due_date), 'dd.MM.yyyy', { locale: ru })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-500" />
                      <span className="text-red-700 font-medium">
                        Просрочено: {task.days_overdue} {task.days_overdue === 1 ? 'день' : task.days_overdue < 5 ? 'дня' : 'дней'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTaskStatus(task.id, 'in-progress')}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      Взять в работу
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      Завершить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeOverdueTasks;