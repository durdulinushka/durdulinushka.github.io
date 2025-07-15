import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Calendar, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeHoursStatsProps {
  employeeId: string;
}

interface HoursStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  dailyAverage: number;
}

const EmployeeHoursStats = ({ employeeId }: EmployeeHoursStatsProps) => {
  const [stats, setStats] = useState<HoursStats>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    dailyAverage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHoursStats();
  }, [employeeId]);

  const loadHoursStats = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
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

      setStats({
        today: todayHours,
        thisWeek: weekHours,
        thisMonth: monthHours,
        dailyAverage
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    </div>
  );
};

export default EmployeeHoursStats;