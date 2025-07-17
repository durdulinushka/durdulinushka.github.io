import { useState, useEffect } from "react";
import { format, isAfter, isBefore, isToday, isThisWeek, addWeeks, startOfDay, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar, User, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  task_type: string;
  due_date: string | null;
  assignee: {
    id: string;
    full_name: string;
  } | null;
}

interface TasksByDeadlineProps {
  employeeId?: string;
}

export const TasksByDeadline = ({ employeeId }: TasksByDeadlineProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [employeeId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          task_type,
          due_date,
          assignee:profiles!tasks_assignee_id_fkey(
            id,
            full_name
          )
        `)
        .neq('status', 'completed')
        .not('archived', 'eq', true);

      if (employeeId) {
        query = query.eq('assignee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить задачи",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress': return '⚡';
      case 'pending': return '⏳';
      default: return '';
    }
  };

  const groupTasksByDeadline = (tasks: Task[]) => {
    const now = new Date();
    const twoWeeksFromNow = addWeeks(now, 2);
    const nextWeekStart = addDays(endOfWeek(now), 1);
    const nextWeekEnd = endOfWeek(nextWeekStart);

    const groups = {
      overdue: [] as Task[],
      today: [] as Task[],
      thisWeek: [] as Task[],
      nextWeek: [] as Task[],
      moreThanTwoWeeks: [] as Task[],
      noDeadline: [] as Task[]
    };

    tasks.forEach(task => {
      if (!task.due_date) {
        groups.noDeadline.push(task);
        return;
      }

      const dueDate = new Date(task.due_date);
      const startOfToday = startOfDay(now);

      if (isBefore(dueDate, startOfToday)) {
        groups.overdue.push(task);
      } else if (isToday(dueDate)) {
        groups.today.push(task);
      } else if (isThisWeek(dueDate)) {
        groups.thisWeek.push(task);
      } else if (dueDate >= nextWeekStart && dueDate <= nextWeekEnd) {
        groups.nextWeek.push(task);
      } else if (isAfter(dueDate, nextWeekEnd) && isBefore(dueDate, twoWeeksFromNow)) {
        groups.nextWeek.push(task);
      } else if (isAfter(dueDate, twoWeeksFromNow)) {
        groups.moreThanTwoWeeks.push(task);
      } else {
        groups.thisWeek.push(task);
      }
    });

    return groups;
  };

  const groupedTasks = groupTasksByDeadline(tasks);

  const TaskColumn = ({ 
    title, 
    tasks, 
    colorClass, 
    icon 
  }: { 
    title: string; 
    tasks: Task[]; 
    colorClass: string;
    icon: React.ReactNode;
  }) => (
    <Card className={cn("h-fit", colorClass)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-auto">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                {task.title}
              </h4>
              <span className="text-xs text-gray-500 shrink-0">
                {getStatusIcon(task.status)}
              </span>
            </div>
            
            {task.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center justify-between gap-2">
              {task.due_date && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {format(new Date(task.due_date), 'd MMMM, HH:mm', { locale: ru })}
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                  {task.priority === 'high' ? 'Высокий' : 
                   task.priority === 'medium' ? 'Средний' : 'Низкий'}
                </Badge>
              </div>
            </div>

            {task.assignee && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <User className="w-3 h-3" />
                {task.assignee.full_name}
              </div>
            )}
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Нет задач
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Задачи по срокам</h2>
        <p className="text-gray-600">Группировка задач по времени выполнения</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <TaskColumn
          title="Просрочены"
          tasks={groupedTasks.overdue}
          colorClass="border-red-200 bg-red-50"
          icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
        />
        
        <TaskColumn
          title="На сегодня"
          tasks={groupedTasks.today}
          colorClass="border-green-200 bg-green-50"
          icon={<Calendar className="w-4 h-4 text-green-600" />}
        />
        
        <TaskColumn
          title="На этой неделе"
          tasks={groupedTasks.thisWeek}
          colorClass="border-blue-200 bg-blue-50"
          icon={<Calendar className="w-4 h-4 text-blue-600" />}
        />
        
        <TaskColumn
          title="На следующей неделе"
          tasks={groupedTasks.nextWeek}
          colorClass="border-purple-200 bg-purple-50"
          icon={<Calendar className="w-4 h-4 text-purple-600" />}
        />
        
        <TaskColumn
          title="Больше двух недель"
          tasks={groupedTasks.moreThanTwoWeeks}
          colorClass="border-indigo-200 bg-indigo-50"
          icon={<Calendar className="w-4 h-4 text-indigo-600" />}
        />
        
        <TaskColumn
          title="Без срока"
          tasks={groupedTasks.noDeadline}
          colorClass="border-gray-200 bg-gray-50"
          icon={<Clock className="w-4 h-4 text-gray-600" />}
        />
      </div>
    </div>
  );
};