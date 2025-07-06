import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, User, Plus } from "lucide-react";
import EmployeeList from "@/components/EmployeeList";
import TaskManagement from "@/components/TaskManagement";
import TaskCommentsAndDocs from "@/components/TaskCommentsAndDocs";

interface AdminDashboardProps {
  onBack: () => void;
}

// Моковые данные
const mockStats = {
  totalEmployees: 12,
  activeToday: 8,
  pendingTasks: 15,
  completedToday: 7
};

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'tasks' | 'reports'>('overview');

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
          <Button variant="outline" onClick={onBack}>
            Назад
          </Button>
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
            variant={activeTab === 'tasks' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('tasks')}
          >
            Задачи
          </Button>
          <Button 
            variant={activeTab === 'reports' ? 'corporate' : 'ghost'}
            onClick={() => setActiveTab('reports')}
          >
            Отчеты
          </Button>
        </div>

        {/* Обзор */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Всего сотрудников
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-corporate-blue">
                    {mockStats.totalEmployees}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Активны сегодня
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-corporate-green">
                    {mockStats.activeToday}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ожидающие задачи
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-corporate-orange">
                    {mockStats.pendingTasks}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Выполнено сегодня
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-corporate-green">
                    {mockStats.completedToday}
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
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Добавить сотрудника</div>
                        <div className="text-sm text-muted-foreground">Регистрация нового сотрудника</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Создать задачу</div>
                        <div className="text-sm text-muted-foreground">Новая задача для сотрудников</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4">
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
          </div>
        )}

        {/* Список сотрудников */}
        {activeTab === 'employees' && <EmployeeList />}

        {/* Управление задачами */}
        {activeTab === 'tasks' && <TaskManagement />}

        {/* Отчеты по задачам */}
        {activeTab === 'reports' && <TaskCommentsAndDocs />}
      </div>
    </div>
  );
};

export default AdminDashboard;