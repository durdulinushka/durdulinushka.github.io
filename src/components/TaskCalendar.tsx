import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { DayCell } from "./DayCell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  planned_date?: string;
  due_date?: string;
}

interface TaskCalendarProps {
  employeeId?: string;
}

export const TaskCalendar = ({ employeeId }: TaskCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
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
        .gte('planned_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('planned_date', format(monthEnd, 'yyyy-MM-dd'));

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
    return tasks.filter(task => task.planned_date === dateStr);
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Календарь задач</CardTitle>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </CardHeader>
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
      </CardContent>
    </Card>
  );
};