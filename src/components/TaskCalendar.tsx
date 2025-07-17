import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { DayCell } from "./DayCell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  task_type?: string;
  start_date?: string;
  due_date?: string;
  planned_date?: string;
}

interface TaskCalendarProps {
  employeeId?: string;
}

export const TaskCalendar = ({ employeeId }: TaskCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Добавляем дни предыдущего месяца для заполнения недели
  const startDay = getDay(monthStart);
  const paddingDays = [];
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (i + 1));
    paddingDays.push(date);
  }

  const calendarDays = [...paddingDays, ...daysInMonth];

  const fetchTasks = async () => {
    try {
      let targetEmployeeId = employeeId;
      if (!targetEmployeeId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
          targetEmployeeId = profile?.id;
        }
      }

      if (!targetEmployeeId) {
        setTasks([]);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', targetEmployeeId)
        .not('start_date', 'is', null) // Исключаем шаблонные задачи
        .or(`planned_date.gte.${format(monthStart, 'yyyy-MM-dd')},due_date.gte.${format(monthStart, 'yyyy-MM-dd')}`)
        .or(`start_date.lte.${format(monthEnd, 'yyyy-MM-dd')},planned_date.lte.${format(monthEnd, 'yyyy-MM-dd')},due_date.lte.${format(monthEnd, 'yyyy-MM-dd')},start_date.gte.${format(monthStart, 'yyyy-MM-dd')},planned_date.gte.${format(monthStart, 'yyyy-MM-dd')},due_date.gte.${format(monthStart, 'yyyy-MM-dd')}`);;

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

  useEffect(() => {
    fetchTasks();
  }, [currentDate, employeeId]);

  const handleTaskMove = async (taskId: string, newDate: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ planned_date: newDate })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, planned_date: newDate } : task
        )
      );

      toast({
        title: "Успешно",
        description: "Задача перенесена",
      });
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось перенести задачу",
        variant: "destructive",
      });
    }
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    return tasks.filter(task => {
      // Ежедневные задачи - отображаются только если не выполнены на сегодня
      if (task.task_type === 'daily') {
        // Показываем только если это сегодня и задача не выполнена
        if (dateStr === today) {
          return task.start_date === dateStr && task.status !== 'completed';
        }
        // Для других дней не показываем ежедневные задачи
        return false;
      }
      
      // Долгосрочные и срочные задачи - только в дату дедлайна
      if (task.task_type === 'long-term' || task.task_type === 'urgent') {
        return task.due_date === dateStr;
      }
      
      // Обратная совместимость для других типов задач
      if (task.start_date && task.due_date) {
        return dateStr >= task.start_date && dateStr <= task.due_date;
      }
      if (task.planned_date === dateStr) return true;
      if (task.due_date === dateStr) return true;
      return false;
    });
  };

  const getTotalTasksForMonth = () => {
    return tasks.length;
  };

  const getCompletedTasksForMonth = () => {
    return tasks.filter(task => task.status === 'completed').length;
  };

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Календарь задач</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <CardTitle>Календарь задач</CardTitle>
              {isCollapsed && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>({getTotalTasksForMonth()} задач, {getCompletedTasksForMonth()} выполнено)</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isCollapsed && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-medium min-w-[140px] text-center">
                    {format(currentDate, 'LLLL yyyy', { locale: ru })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent>
            {/* Заголовки дней недели */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Календарная сетка */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date, index) => (
                <DayCell
                  key={index}
                  date={date}
                  tasks={getTasksForDate(date)}
                  isCurrentMonth={isSameMonth(date, currentDate)}
                  isToday={isToday(date)}
                  onTaskMove={handleTaskMove}
                />
              ))}
            </div>

            {/* Статистика месяца */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Всего задач в месяце: {getTotalTasksForMonth()}</span>
                <span>Выполнено: {getCompletedTasksForMonth()}</span>
                <span>В работе: {getTotalTasksForMonth() - getCompletedTasksForMonth()}</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};