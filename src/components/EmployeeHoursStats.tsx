import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, TrendingUp, Calendar, Target, CheckCircle, ListTodo, AlertTriangle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeHoursStatsProps {
  employeeId: string;
}

interface HoursStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  dailyAverage: number;
  tasksWeek: number;
  tasksMonth: number;
  overdueTasksWeek: number;
  overdueTasksMonth: number;
  dailyHours: number; // Норма часов в день
}

const EmployeeHoursStats = ({ employeeId }: EmployeeHoursStatsProps) => {
  const [stats, setStats] = useState<HoursStats>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    dailyAverage: 0,
    tasksWeek: 0,
    tasksMonth: 0,
    overdueTasksWeek: 0,
    overdueTasksMonth: 0,
    dailyHours: 8
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHoursStats();
  }, [employeeId]);

  const loadHoursStats = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Получаем данные профиля для нормы часов
      const { data: profileData } = await supabase
        .from('profiles')
        .select('daily_hours')
        .eq('id', employeeId)
        .single();
      
      const dailyHours = profileData?.daily_hours || 8;
      
      // Начало недели (понедельник)
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      
      // Начало месяца
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Часы за сегодня
      const { data: todayData } = await supabase
        .from('time_tracking')
        .select('total_hours')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .not('total_hours', 'is', null);

      // Часы за неделю
      const { data: weekData } = await supabase
        .from('time_tracking')
        .select('total_hours')
        .eq('employee_id', employeeId)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .not('total_hours', 'is', null);

      // Часы за месяц
      const { data: monthData } = await supabase
        .from('time_tracking')
        .select('total_hours')
        .eq('employee_id', employeeId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .not('total_hours', 'is', null);

      const todayHours = todayData?.reduce((sum, record) => sum + (record.total_hours || 0), 0) || 0;
      const weekHours = weekData?.reduce((sum, record) => sum + (record.total_hours || 0), 0) || 0;
      const monthHours = monthData?.reduce((sum, record) => sum + (record.total_hours || 0), 0) || 0;
      
      // Средние часы в день за месяц
      const workingDaysThisMonth = monthData?.length || 1;
      const dailyAverage = monthHours / workingDaysThisMonth;

      // Задачи за неделю
      const { data: weekTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('assignee_id', employeeId)
        .eq('status', 'completed')
        .gte('completed_at', startOfWeek.toISOString());

      // Задачи за месяц  
      const { data: monthTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('assignee_id', employeeId)
        .eq('status', 'completed')
        .gte('completed_at', startOfMonth.toISOString());

      // Просроченные задачи за неделю
      const { data: overdueWeekTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('assignee_id', employeeId)
        .eq('status', 'overdue')
        .gte('updated_at', startOfWeek.toISOString());

      // Просроченные задачи за месяц
      const { data: overdueMonthTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('assignee_id', employeeId)
        .eq('status', 'overdue')
        .gte('updated_at', startOfMonth.toISOString());

      setStats({
        today: todayHours,
        thisWeek: weekHours,
        thisMonth: monthHours,
        dailyAverage,
        tasksWeek: weekTasks?.length || 0,
        tasksMonth: monthTasks?.length || 0,
        overdueTasksWeek: overdueWeekTasks?.length || 0,
        overdueTasksMonth: overdueMonthTasks?.length || 0,
        dailyHours
      });
    } catch (error) {
      console.error('Error loading hours stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}ч ${m}м`;
  };

  // Расчет плановых показателей
  const getPlanData = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentDate = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    // План на день
    const dailyPlan = stats.dailyHours;
    
    // План на неделю (до текущего дня недели)
    const weeklyWorkedDays = currentDay === 0 ? 5 : Math.min(currentDay, 5); // 5 рабочих дней максимум
    const weeklyPlan = dailyPlan * weeklyWorkedDays;
    
    // План на месяц (до текущего дня месяца)
    const monthlyWorkedDays = Math.min(currentDate, 22); // примерно 22 рабочих дня в месяце
    const monthlyPlan = dailyPlan * monthlyWorkedDays;
    
    return {
      dailyPlan,
      weeklyPlan,
      monthlyPlan,
      weeklyWorkedDays,
      monthlyWorkedDays
    };
  };

  const getPerformanceStatus = (actual: number, plan: number) => {
    const percentage = plan > 0 ? (actual / plan) * 100 : 0;
    if (percentage >= 100) return { status: 'excellent', color: 'bg-green-500', text: 'Норма выполнена' };
    if (percentage >= 80) return { status: 'good', color: 'bg-yellow-500', text: 'Близко к норме' };
    return { status: 'needs-improvement', color: 'bg-red-500', text: 'Ниже нормы' };
  };

  const planData = getPlanData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="dashboard-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Статистика рабочего времени</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatHours(stats.today)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.today > 0 ? "Активно работает" : "Еще не начал"}
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">За неделю</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatHours(stats.thisWeek)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Текущая неделя
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">За месяц</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatHours(stats.thisMonth)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Текущий месяц
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Среднее в день</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatHours(stats.dailyAverage)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              За этот месяц
            </p>
          </CardContent>
        </Card>
      </div>

      {/* План-факт выработки часов */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">План-факт выработки часов</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Сегодня */}
          <Card className="dashboard-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Сегодня
                <Badge className={`${getPerformanceStatus(stats.today, planData.dailyPlan).color} text-white text-xs`}>
                  {getPerformanceStatus(stats.today, planData.dailyPlan).text}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">План:</span>
                <span className="font-medium">{formatHours(planData.dailyPlan)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Факт:</span>
                <span className="font-medium">{formatHours(stats.today)}</span>
              </div>
              <Progress 
                value={planData.dailyPlan > 0 ? (stats.today / planData.dailyPlan) * 100 : 0} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground text-center">
                {planData.dailyPlan > 0 ? Math.round((stats.today / planData.dailyPlan) * 100) : 0}% выполнено
              </div>
            </CardContent>
          </Card>

          {/* За неделю */}
          <Card className="dashboard-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                За неделю
                <Badge className={`${getPerformanceStatus(stats.thisWeek, planData.weeklyPlan).color} text-white text-xs`}>
                  {getPerformanceStatus(stats.thisWeek, planData.weeklyPlan).text}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">План:</span>
                <span className="font-medium">{formatHours(planData.weeklyPlan)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Факт:</span>
                <span className="font-medium">{formatHours(stats.thisWeek)}</span>
              </div>
              <Progress 
                value={planData.weeklyPlan > 0 ? (stats.thisWeek / planData.weeklyPlan) * 100 : 0} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground text-center">
                {planData.weeklyPlan > 0 ? Math.round((stats.thisWeek / planData.weeklyPlan) * 100) : 0}% выполнено
              </div>
            </CardContent>
          </Card>

          {/* За месяц */}
          <Card className="dashboard-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                За месяц
                <Badge className={`${getPerformanceStatus(stats.thisMonth, planData.monthlyPlan).color} text-white text-xs`}>
                  {getPerformanceStatus(stats.thisMonth, planData.monthlyPlan).text}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">План:</span>
                <span className="font-medium">{formatHours(planData.monthlyPlan)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Факт:</span>
                <span className="font-medium">{formatHours(stats.thisMonth)}</span>
              </div>
              <Progress 
                value={planData.monthlyPlan > 0 ? (stats.thisMonth / planData.monthlyPlan) * 100 : 0} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground text-center">
                {planData.monthlyPlan > 0 ? Math.round((stats.thisMonth / planData.monthlyPlan) * 100) : 0}% выполнено
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Общий анализ выполнения нормы */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Анализ выполнения нормы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Норма выполнена (100%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Близко к норме (80-99%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Ниже нормы (&lt;80%)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Норма в день:</span>
                  <span className="ml-2 font-medium">{formatHours(stats.dailyHours)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Среднее в день:</span>
                  <span className="ml-2 font-medium">{formatHours(stats.dailyAverage)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Отклонение:</span>
                  <span className={`ml-2 font-medium ${stats.dailyAverage >= stats.dailyHours ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.dailyAverage >= stats.dailyHours ? '+' : ''}{formatHours(stats.dailyAverage - stats.dailyHours)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Statistics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Выполненные задачи</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">За неделю</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.tasksWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Задач завершено
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">За месяц</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.tasksMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Задач завершено
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card border-red-200 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">За неделю</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueTasksWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Задач просрочено
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card border-red-200 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">За месяц</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueTasksMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Задач просрочено
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeHoursStats;