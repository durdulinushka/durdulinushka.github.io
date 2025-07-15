import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EmployeeHoursCalendarProps {
  employeeId: string;
}

interface DayHours {
  date: string;
  hours: number;
  status: 'not-started' | 'working' | 'paused' | 'finished';
}

const EmployeeHoursCalendar = ({ employeeId }: EmployeeHoursCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoursData, setHoursData] = useState<DayHours[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthData();
  }, [employeeId, currentDate]);

  const loadMonthData = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      const { data, error } = await supabase
        .from('time_tracking')
        .select('date, total_hours, status')
        .eq('employee_id', employeeId)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const daysInMonth = eachDayOfInterval({ start, end });
      const hoursMap = new Map(
        (data || []).map(record => [
          record.date,
          {
            date: record.date,
            hours: record.total_hours || 0,
            status: (record.status as 'not-started' | 'working' | 'paused' | 'finished') || 'not-started'
          }
        ])
      );

      const monthData = daysInMonth.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return hoursMap.get(dateStr) || {
          date: dateStr,
          hours: 0,
          status: 'not-started' as const
        };
      });

      setHoursData(monthData);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    if (hours === 0) return '0ч';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}ч`;
    return `${h}ч ${m}м`;
  };

  const getStatusColor = (status: string, hours: number) => {
    if (hours === 0) return 'bg-muted text-muted-foreground';
    
    switch (status) {
      case 'finished':
        return 'bg-corporate-green text-white';
      case 'working':
        return 'bg-corporate-blue text-white';
      case 'paused':
        return 'bg-corporate-orange text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string, hours: number) => {
    if (hours === 0) return 'Не работал';
    
    switch (status) {
      case 'finished':
        return 'Завершен';
      case 'working':
        return 'В работе';
      case 'paused':
        return 'На паузе';
      default:
        return 'Неопределен';
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

  const totalHoursThisMonth = hoursData.reduce((sum, day) => sum + day.hours, 0);
  const workingDays = hoursData.filter(day => day.hours > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Календарь рабочего времени</h2>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-lg">
                {format(currentDate, 'LLLL yyyy', { locale: ru })}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Всего: {formatHours(totalHoursThisMonth)} | Рабочих дней: {workingDays}
              </div>
              <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
                Текущий месяц
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Заголовки дней недели */}
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="p-3 text-center font-medium text-muted-foreground text-sm">
                  {day}
                </div>
              ))}
              
              {/* Пустые ячейки для выравнивания первой недели */}
              {Array.from({ length: (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7 }, (_, i) => (
                <div key={i} className="p-3"></div>
              ))}
              
              {/* Дни месяца */}
              {hoursData.map(dayData => {
                const day = new Date(dayData.date);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={dayData.date}
                    className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                      isToday ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="font-medium">
                        {format(day, 'd')}
                      </div>
                      
                      {dayData.hours > 0 && (
                        <>
                          <div className="text-xs font-medium text-primary">
                            {formatHours(dayData.hours)}
                          </div>
                          <Badge 
                            className={`text-xs ${getStatusColor(dayData.status, dayData.hours)}`}
                          >
                            {getStatusLabel(dayData.status, dayData.hours)}
                          </Badge>
                        </>
                      )}
                      
                      {dayData.hours === 0 && (
                        <div className="text-xs text-muted-foreground">
                          Не работал
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeHoursCalendar;