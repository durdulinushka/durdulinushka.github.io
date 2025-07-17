import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, Clock, Pause, User, LogOut, BarChart3, Settings, Calendar, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import TaskTracker from "@/components/TaskTracker";
import EmployeeTaskCalendar from "@/components/EmployeeTaskCalendar";
import EmployeeTaskColumns from "@/components/EmployeeTaskColumns";
import EmployeeHoursStats from "@/components/EmployeeHoursStats";
import { EditProfileNameDialog } from "@/components/EditProfileNameDialog";
import MessengerDashboard from "@/components/MessengerDashboard";
import { TasksByDeadline } from "@/components/TasksByDeadline";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeDashboardProps {
  onBack: () => void;
  employeeId?: string; // Optional employee ID for admin impersonation
}

interface Employee {
  name: string;
  department: string;
  position: string;
  dailyHours: number;
}

const EmployeeDashboard = ({ onBack, employeeId: impersonatedEmployeeId }: EmployeeDashboardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employeeId, setEmployeeId] = useState<string>("");
  const [employee, setEmployee] = useState<Employee>({
    name: "Загрузка...",
    department: "Загрузка...",
    position: "Загрузка...",
    dailyHours: 8
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getCurrentUser = async () => {
      // If impersonatedEmployeeId is provided, use it instead of current user
      if (impersonatedEmployeeId) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, department, position, daily_hours')
          .eq('id', impersonatedEmployeeId)
          .single();
        
        if (data) {
          setEmployeeId(data.id);
          setEmployee({
            name: data.full_name,
            department: data.department,
            position: data.position,
            dailyHours: data.daily_hours || 8
          });
        }
      } else {
        // Normal employee view - get current user's data
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, department, position, daily_hours')
            .eq('user_id', user.id)
            .single();
          
          if (data) {
            setEmployeeId(data.id);
            setEmployee({
              name: data.full_name,
              department: data.department,
              position: data.position,
              dailyHours: data.daily_hours || 8
            });
          }
        }
      }
    };

    getCurrentUser();
  }, [impersonatedEmployeeId]);

  const handleNameUpdated = (newName: string) => {
    setEmployee(prev => ({ ...prev, name: newName }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Рабочая панель</h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString('ru-RU', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={onBack}>
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Профиль сотрудника */}
        <Card className="dashboard-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{employee.name}</CardTitle>
                  <CardDescription>
                    {employee.position} • {employee.department}
                  </CardDescription>
                </div>
              </div>
              <EditProfileNameDialog onNameUpdated={handleNameUpdated} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Рабочий день: {employee.dailyHours} часов
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Навигация с вкладками */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Рабочий стол
            </TabsTrigger>
            <TabsTrigger value="deadlines" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Сроки
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Часы
            </TabsTrigger>
            <TabsTrigger value="messenger" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Сообщения
            </TabsTrigger>
          </TabsList>

          {/* Вкладка: Рабочий стол */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Основная сетка */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Трекер задач и времени */}
              <TaskTracker dailyHours={employee.dailyHours} employeeId={employeeId} />
            </div>

            {/* Колонки задач */}
            <EmployeeTaskColumns employeeId={employeeId} />

            {/* Календарь задач - на всю ширину */}
            <EmployeeTaskCalendar employeeId={employeeId} />
          </TabsContent>

          {/* Вкладка: По срокам */}
          <TabsContent value="deadlines" className="space-y-6">
            <TasksByDeadline employeeId={employeeId} />
          </TabsContent>

          {/* Вкладка: Профиль */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Настройки профиля
                </CardTitle>
                <CardDescription>
                  Управление личными данными и настройками
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Полное имя</label>
                    <p className="text-sm text-muted-foreground">{employee.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Должность</label>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Отдел</label>
                    <p className="text-sm text-muted-foreground">{employee.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Рабочих часов в день</label>
                    <p className="text-sm text-muted-foreground">{employee.dailyHours}</p>
                  </div>
                </div>
                <div className="pt-4">
                  <EditProfileNameDialog onNameUpdated={handleNameUpdated} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка: Статистика */}
          <TabsContent value="stats" className="space-y-6">
            <EmployeeHoursStats employeeId={employeeId} />
          </TabsContent>

          {/* Вкладка: Часы */}
          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Рабочие часы
                </CardTitle>
                <CardDescription>
                  Детальная информация о рабочем времени
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{employee.dailyHours}ч</div>
                    <div className="text-sm text-muted-foreground">Норма в день</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{employee.dailyHours * 5}ч</div>
                    <div className="text-sm text-muted-foreground">Норма в неделю</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{employee.dailyHours * 22}ч</div>
                    <div className="text-sm text-muted-foreground">Норма в месяц</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <EmployeeHoursStats employeeId={employeeId} />
          </TabsContent>

          {/* Вкладка: Мессенджер */}
          <TabsContent value="messenger" className="space-y-6">
            <MessengerDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeeDashboard;