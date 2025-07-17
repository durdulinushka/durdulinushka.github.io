import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Clock, User, AlertCircle, List } from "lucide-react";
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
  description?: string;
  status: string;
  priority: string;
  task_type?: string;
  start_date: string | null;
  due_date: string | null;
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
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
          description,
          status,
          priority,
          task_type,
          start_date,
          due_date,
          assignee:profiles!tasks_assignee_id_fkey(
            id,
            full_name
          )
        `)
        .or(`start_date.lte.${format(calendarEnd, 'yyyy-MM-dd')},due_date.lte.${format(calendarEnd, 'yyyy-MM-dd')}`)
        .or(`start_date.gte.${format(calendarStart, 'yyyy-MM-dd')},due_date.gte.${format(calendarStart, 'yyyy-MM-dd')}`)
        .not('start_date', 'is', null); // Исключаем шаблонные задачи без дат

      // Если передан employeeId, фильтруем только по этому сотруднику
      if (employeeId) {
        query = query.eq('assignee_id', employeeId);
      }

      const { data: tasks, error } = await query;

      if (error) throw error;

      // Создаем календарную сетку
      const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      
      const calendarData = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const today = format(new Date(), 'yyyy-MM-dd');
        
        const dayTasks = (tasks || []).filter(task => {
          // Ежедневные задачи - отображаются каждый день, если не выполнены сегодня
          if (task.task_type === 'daily') {
            // Если дата в календаре - сегодня, показываем только невыполненные
            if (dayStr === today) {
              return task.status !== 'completed';
            }
            // Для других дней (прошлых и будущих) не показываем ежедневные задачи
            return false;
          }
          
          // Долгосрочные и срочные задачи - только в дату дедлайна
          if (task.task_type === 'long-term' || task.task_type === 'urgent') {
            return task.due_date === dayStr;
          }
          
          // Другие типы задач - проверяем диапазон
          if (task.start_date && task.due_date) {
            return dayStr >= task.start_date && dayStr <= task.due_date;
          }
          if (task.due_date && !task.start_date) {
            return task.due_date === dayStr;
          }
          if (task.start_date && !task.due_date) {
            return task.start_date === dayStr;
          }
          return false;
        });

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
      case 'in-progress':
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Неизвестно';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Выполнено';
      case 'in_progress':
      case 'in-progress': return 'В работе';
      case 'pending': return 'Ожидает';
      default: return status;
    }
  };

  const handleDayClick = (dayData: CalendarDay) => {
    if (dayData.tasks.length > 0) {
      setSelectedDay(dayData);
      setIsDialogOpen(true);
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
                className={`min-h-[140px] p-3 border border-border transition-all hover:bg-muted/50 rounded-lg cursor-pointer ${
                  dayData.isToday ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary shadow-md' : ''
                } ${
                  !dayData.isCurrentMonth ? 'opacity-50' : ''
                }`}
                onClick={() => handleDayClick(dayData)}
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
                    <HoverCard key={task.id}>
                      <HoverCardTrigger asChild>
                        <div
                          className={`text-sm p-2 rounded-md cursor-pointer hover:opacity-80 transition-all hover:shadow-sm ${getPriorityColor(task.priority)}`}
                        >
                          <div className="truncate font-semibold text-sm">
                            {task.title}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <Badge className={`text-xs px-2 py-1 ${getStatusColor(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </Badge>
                            {task.assignee && !employeeId && (
                              <span className="text-xs text-muted-foreground truncate ml-2 max-w-[80px]" title={task.assignee.full_name}>
                                {task.assignee.full_name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80" side="top">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-base mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Приоритет</p>
                                <Badge variant="outline" className={`text-xs ${
                                  task.priority === 'high' ? 'border-corporate-blue text-corporate-blue' :
                                  task.priority === 'medium' ? 'border-corporate-teal text-corporate-teal' :
                                  'border-corporate-green text-corporate-green'
                                }`}>
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Статус</p>
                                <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                  {getStatusLabel(task.status)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {task.assignee && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Исполнитель</p>
                                <p className="text-sm font-medium">{task.assignee.full_name}</p>
                              </div>
                            </div>
                          )}
                          
                           <div className="flex items-center gap-2">
                             <Clock className="w-4 h-4 text-muted-foreground" />
                             <div>
                               <p className="text-xs text-muted-foreground">Период</p>
                               <p className="text-sm font-medium">
                                 {task.start_date && task.due_date 
                                   ? `${format(new Date(task.start_date), 'd MMM', { locale: ru })} - ${format(new Date(task.due_date), 'd MMM yyyy', { locale: ru })}` 
                                   : task.due_date 
                                     ? format(new Date(task.due_date), 'd MMMM yyyy', { locale: ru })
                                     : task.start_date 
                                       ? format(new Date(task.start_date), 'd MMMM yyyy', { locale: ru })
                                       : 'Бессрочная'
                                 }
                               </p>
                             </div>
                           </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                  
                  {dayData.tasks.length > 3 && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="text-xs text-muted-foreground text-center py-1 cursor-pointer hover:text-primary">
                          +{dayData.tasks.length - 3} еще
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80" side="top">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm mb-2">Дополнительные задачи:</h4>
                          {dayData.tasks.slice(3).map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex-1">
                                <p className="text-sm font-medium truncate">{task.title}</p>
                                {task.assignee && (
                                  <p className="text-xs text-muted-foreground">{task.assignee.full_name}</p>
                                )}
                              </div>
                              <Badge className={`text-xs ml-2 ${getStatusColor(task.status)}`}>
                                {getStatusLabel(task.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
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

      {/* Dialog для просмотра всех задач дня */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              Задачи на {selectedDay && format(selectedDay.date, "d MMMM yyyy", { locale: ru })}
            </DialogTitle>
            <DialogDescription>
              Всего задач: {selectedDay?.tasks.length || 0}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedDay?.tasks.map((task, index) => (
              <div 
                key={task.id} 
                className={`p-4 rounded-lg border transition-all hover:shadow-md ${getPriorityColor(task.priority)} bg-opacity-10`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${
                      task.priority === "high" ? "border-corporate-blue text-corporate-blue" :
                      task.priority === "medium" ? "border-corporate-teal text-corporate-teal" :
                      "border-corporate-green text-corporate-green"
                    }`}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  {task.assignee && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Исполнитель:</span>
                      <span className="font-medium">{task.assignee.full_name}</span>
                    </div>
                  )}
                   <div className="flex items-center gap-2">
                     <Clock className="w-4 h-4 text-muted-foreground" />
                     <span className="text-muted-foreground">Период:</span>
                     <span className="font-medium">
                       {task.start_date && task.due_date 
                         ? `${format(new Date(task.start_date), 'd MMM', { locale: ru })} - ${format(new Date(task.due_date), 'd MMM yyyy', { locale: ru })}` 
                         : task.due_date 
                           ? format(new Date(task.due_date), 'd MMMM yyyy', { locale: ru })
                           : task.start_date 
                             ? format(new Date(task.start_date), 'd MMMM yyyy', { locale: ru })
                             : 'Бессрочная'
                       }
                     </span>
                   </div>
                </div>
              </div>
            ))}
            
            {(!selectedDay?.tasks || selectedDay.tasks.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>На этот день задач нет</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeTaskCalendar;