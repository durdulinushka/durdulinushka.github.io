import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, User, Plus, UserCheck, Archive, FileText, LogOut, Filter, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import EmployeeList from "@/components/EmployeeList";
import TaskManagement from "@/components/TaskManagement";
import TaskCommentsAndDocs from "@/components/TaskCommentsAndDocs";
import { ProjectManagement } from "./ProjectManagement";
import { TaskArchive } from "./TaskArchive";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { ImpersonateEmployeeDialog } from "./ImpersonateEmployeeDialog";
import DepartmentManagement from "./DepartmentManagement";
import MaterialsManagement from "./MaterialsManagement";
import { TasksByDeadline } from "./TasksByDeadline";
import EmployeeTaskCalendar from "./EmployeeTaskCalendar";
import MessengerDashboard from "./MessengerDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  onBack: () => void;
  onImpersonate?: (employeeId: string, employeeName: string) => void;
  onSwitchToEmployeeView?: () => void;
}

interface Stats {
  totalEmployees: number;
  activeToday: number;
  pendingTasks: number;
  completedToday: number;
}

const AdminDashboard = ({ onBack, onImpersonate, onSwitchToEmployeeView }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'projects' | 'tasks' | 'deadlines' | 'departments' | 'materials' | 'archive' | 'reports' | 'messenger'>('overview');
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    activeToday: 0,
    pendingTasks: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [selectedEmployeeForCalendar, setSelectedEmployeeForCalendar] = useState<string>('all');
  const [employees, setEmployees] = useState<Array<{id: string, full_name: string}>>([]);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Получаем общее количество сотрудников и их данные
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('id, full_name');

      if (employeesError) throw employeesError;

      // Получаем количество активных сотрудников сегодня (тех, кто логинился сегодня)
      const today = new Date().toISOString().split('T')[0];
      const { data: activeEmployees, error: activeError } = await supabase
        .from('time_tracking')
        .select('employee_id')
        .eq('date', today)
        .not('login_time', 'is', null);

      if (activeError) throw activeError;

      // Получаем количество задач в ожидании
      const { data: pendingTasks, error: pendingError } = await supabase
        .from('tasks')
        .select('id')
        .in('status', ['pending', 'in_progress']);

      if (pendingError) throw pendingError;

      // Получаем количество задач, выполненных сегодня
      const { data: completedTasks, error: completedError } = await supabase
        .from('tasks')
        .select('id')
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00.000Z`)
        .lt('completed_at', `${today}T23:59:59.999Z`);

      if (completedError) throw completedError;

      // Уникальные активные сотрудники
      const uniqueActiveEmployees = [...new Set(activeEmployees?.map(emp => emp.employee_id) || [])];

      setStats({
        totalEmployees: employeesData?.length || 0,
        activeToday: uniqueActiveEmployees.length,
        pendingTasks: pendingTasks?.length || 0,
        completedToday: completedTasks?.length || 0
      });

      // Сохраняем список сотрудников для фильтра
      setEmployees(employeesData || []);

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Панель администратора</h1>
            <p className="text-muted-foreground">
              Управление сотрудниками и задачами
            </p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            {onSwitchToEmployeeView && (
              <Button variant="outline" onClick={onSwitchToEmployeeView}>
                <User className="w-4 h-4 mr-2" />
                Мой кабинет сотрудника
              </Button>
            )}
            {onImpersonate && (
              <Button variant="outline" onClick={() => setImpersonateDialogOpen(true)}>
                <UserCheck className="w-4 h-4 mr-2" />
                Войти как сотрудник
              </Button>
            )}
            <Button variant="outline" onClick={onBack}>
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex gap-2 border-b">
          <Button 
            variant={activeTab === 'overview' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('overview')}
          >
            Обзор
          </Button>
          <Button 
            variant={activeTab === 'employees' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('employees')}
          >
            Сотрудники
          </Button>
          <Button 
            variant={activeTab === 'projects' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('projects')}
          >
            Проекты
          </Button>
          <Button 
            variant={activeTab === 'tasks' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('tasks')}
          >
            Задачи
          </Button>
          <Button 
            variant={activeTab === 'deadlines' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('deadlines')}
          >
            По срокам
          </Button>
          <Button 
            variant={activeTab === 'departments' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('departments')}
          >
            Отделы
          </Button>
          <Button 
            variant={activeTab === 'materials' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('materials')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Материалы
          </Button>
          <Button 
            variant={activeTab === 'archive' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('archive')}
          >
            <Archive className="w-4 h-4 mr-2" />
            Архив
          </Button>
          <Button 
            variant={activeTab === 'reports' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('reports')}
          >
            Отчеты
          </Button>
          <Button 
            variant={activeTab === 'messenger' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('messenger')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Мессенджер
          </Button>
        </div>

        {/* Обзор */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="dashboard-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Всего сотрудников
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {loading ? "..." : stats.totalEmployees}
                  </div>
                </CardContent>
              </Card>

              <Card className="dashboard-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Активны сегодня
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {loading ? "..." : stats.activeToday}
                  </div>
                </CardContent>
              </Card>

              <Card className="dashboard-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ожидающие задачи
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {loading ? "..." : stats.pendingTasks}
                  </div>
                </CardContent>
              </Card>

              <Card className="dashboard-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Выполнено сегодня
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {loading ? "..." : stats.completedToday}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Быстрые действия */}
            <Card>
              <CardHeader>
                <CardTitle>Быстрые действия</CardTitle>
                <CardDescription>
                  Основные функции управления
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => setActiveTab('employees')}
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Добавить сотрудника</div>
                        <div className="text-sm text-muted-foreground">Регистрация нового сотрудника</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => setActiveTab('tasks')}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Создать задачу</div>
                        <div className="text-sm text-muted-foreground">Новая задача для сотрудников</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => setActiveTab('reports')}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Отчеты</div>
                        <div className="text-sm text-muted-foreground">Анализ рабочего времени</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Календарь задач */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Календарь задач</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select 
                    value={selectedEmployeeForCalendar} 
                    onValueChange={setSelectedEmployeeForCalendar}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Выберите сотрудника" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все сотрудники</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <EmployeeTaskCalendar 
                employeeId={selectedEmployeeForCalendar === 'all' ? undefined : selectedEmployeeForCalendar}
              />
            </div>
          </div>
        )}

        {/* Список сотрудников */}
        {activeTab === 'employees' && <EmployeeList />}

        {/* Управление проектами */}
        {activeTab === 'projects' && <ProjectManagement isAdmin={true} />}

        {/* Управление задачами */}
        {activeTab === 'tasks' && <TaskManagement />}

        {/* Задачи по срокам */}
        {activeTab === 'deadlines' && <TasksByDeadline />}

        {/* Управление отделами */}
        {activeTab === 'departments' && <DepartmentManagement />}

        {/* Управление материалами */}
        {activeTab === 'materials' && <MaterialsManagement />}

        {/* Архив задач */}
        {activeTab === 'archive' && <TaskArchive />}

        {/* Отчеты по задачам */}
        {activeTab === 'reports' && <TaskCommentsAndDocs />}

        {/* Мессенджер */}
        {activeTab === 'messenger' && <MessengerDashboard />}
      </div>

      {/* Диалог входа как сотрудник */}
      <ImpersonateEmployeeDialog
        open={impersonateDialogOpen}
        onOpenChange={setImpersonateDialogOpen}
        onImpersonate={(employeeId, employeeName) => {
          if (onImpersonate) {
            onImpersonate(employeeId, employeeName);
          }
        }}
      />
    </div>
  );
};

export default AdminDashboard;