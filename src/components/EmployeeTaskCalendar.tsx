import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EmployeeTaskCalendarProps {
  employeeId?: string; // Опционально - если передан, показываем только задачи этого сотрудника
  showAddButton?: boolean; // Показывать ли кнопку добавления задач
  onAddTask?: () => void; // Колбэк для добавления задачи
}

interface TaskForCalendar {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  assignee?: {
    full_name: string;
    id: string;
  };
}

interface CalendarDay {
  date: Date;
  tasks: TaskForCalendar[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const EmployeeTaskCalendar = ({ employeeId, showAddButton = false, onAddTask }: EmployeeTaskCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, employeeId]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Получаем диапазон для календарной сетки (включая дни из соседних месяцев)
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Неделя начинается с понедельника
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

      // Запрос задач за период
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          assignee:profiles!tasks_assignee_id_fkey(
            id,
            full_name
          )
        `)
        .gte('due_date', format(calendarStart, 'yyyy-MM-dd'))
        .lte('due_date', format(calendarEnd, 'yyyy-MM-dd'))
        .not('due_date', 'is', null);

      // Если передан employeeId, фильтруем только по этому сотруднику
      if (employeeId) {
        query = query.eq('assignee_id', employeeId);
      }

      const { data: tasks, error } = await query;

      if (error) throw error;

      // Создаем календарную сетку
      const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      
      const calendarData = days.map(day => {
        const dayTasks = (tasks || []).filter(task => 
          task.due_date && isSameDay(new Date(task.due_date), day)
        );

        return {
          date: day,
          tasks: dayTasks as TaskForCalendar[],
          isCurrentMonth: isSameMonth(day, currentDate),
          isToday: isSameDay(day, new Date())
        };
      });

      setCalendarDays(calendarData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-corporate-green text-white';
      case 'in_progress':
        return 'bg-corporate-blue text-white';
      case 'pending':
        return 'bg-corporate-sage text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-corporate-blue';
      case 'medium':
        return 'border-l-4 border-l-corporate-teal';
      case 'low':
        return 'border-l-4 border-l-corporate-green';
      default:
        return 'border-l-4 border-l-gray-300';
    }
  };

  if (loading) {
    return (
      <Card className="dashboard-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Календарь задач
        </h2>
      </div>

      <Card className="dashboard-card shadow-lg border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="hover:bg-primary/10">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-xl font-bold">
                {format(currentDate, 'LLLL yyyy', { locale: ru })}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={goToNextMonth} className="hover:bg-primary/10">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              {showAddButton && onAddTask && (
                <Button onClick={onAddTask} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить задачу
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={goToCurrentMonth} className="hover:bg-primary/10">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Сегодня
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-3">
            {/* Заголовки дней недели */}
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="p-4 text-center font-semibold text-muted-foreground text-sm bg-muted/50 rounded-lg">
                {day}
              </div>
            ))}
            
            {/* Дни календаря */}
            {calendarDays.map((dayData, index) => (
              <div 
                key={index}
                className={`min-h-[140px] p-3 border border-border transition-all hover:bg-muted/50 rounded-lg ${
                  dayData.isToday ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary shadow-md' : ''
                } ${
                  !dayData.isCurrentMonth ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-lg font-bold ${
                    dayData.isToday ? 'text-primary font-bold' : 
                    dayData.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {format(dayData.date, 'd')}
                  </span>
                  {dayData.isToday && (
                    <Badge variant="default" className="text-xs px-2 py-1 bg-primary/20 text-primary border-primary/30">
                      Сегодня
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  {dayData.tasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`text-sm p-2 rounded-md cursor-pointer hover:opacity-80 transition-all hover:shadow-sm ${getPriorityColor(task.priority)}`}
                      title={`${task.title}${task.assignee ? ` - ${task.assignee.full_name}` : ''}`}
                    >
                      <div className="truncate font-semibold text-sm">
                        {task.title}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={`text-xs px-2 py-1 ${getStatusColor(task.status)}`}>
                          {task.status === 'completed' ? 'Выполнено' :
                           task.status === 'in_progress' ? 'В работе' :
                           task.status === 'pending' ? 'Ожидает' : task.status}
                        </Badge>
                        {task.assignee && !employeeId && (
                          <span className="text-xs text-muted-foreground truncate ml-2 max-w-[80px]" title={task.assignee.full_name}>
                            {task.assignee.full_name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {dayData.tasks.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{dayData.tasks.length - 3} еще
                    </div>
                  )}
                  
                  {showAddButton && dayData.isCurrentMonth && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-6 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => onAddTask && onAddTask()}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Добавить
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeTaskCalendar;