import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User } from "lucide-react";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import AdminDashboard from "@/components/AdminDashboard";

const Index = () => {
  const [userRole, setUserRole] = useState<'employee' | 'admin' | null>(null);

  if (userRole === 'employee') {
    return <EmployeeDashboard onBack={() => setUserRole(null)} />;
  }

  if (userRole === 'admin') {
    return <AdminDashboard onBack={() => setUserRole(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-corporate-blue to-corporate-blue-dark bg-clip-text text-transparent">
            Система Управления Персоналом
          </h1>
          <p className="text-xl text-muted-foreground">
            Управление рабочим временем и задачами сотрудников
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Card className="hover:shadow-[var(--shadow-corporate)] transition-all cursor-pointer group" 
                onClick={() => setUserRole('employee')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-corporate-blue/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-corporate-blue" />
              </div>
              <CardTitle className="text-2xl">Сотрудник</CardTitle>
              <CardDescription>
                Трекинг рабочего времени и управление задачами
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Учет рабочего времени</li>
                <li>• Управление задачами</li>
                <li>• Уведомления и напоминания</li>
                <li>• Отчеты по времени</li>
              </ul>
              <Button variant="corporate" className="w-full">
                Войти как сотрудник
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--shadow-corporate)] transition-all cursor-pointer group"
                onClick={() => setUserRole('admin')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-corporate-blue/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-corporate-blue" />
              </div>
              <CardTitle className="text-2xl">Администратор</CardTitle>
              <CardDescription>
                Управление сотрудниками и задачами
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Управление сотрудниками</li>
                <li>• Распределение задач</li>
                <li>• Отчеты и аналитика</li>
                <li>• Настройка рабочих планов</li>
              </ul>
              <Button variant="corporate" className="w-full">
                Войти как администратор
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center space-y-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/auth'}
            className="mr-4"
          >
            Войти в систему
          </Button>
          <p className="text-sm text-muted-foreground">
            Для полноценной работы системы необходимо подключить Supabase интеграцию
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;