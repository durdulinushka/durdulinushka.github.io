import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, Clock, Pause, User } from "lucide-react";
import TaskTracker from "@/components/TaskTracker";

interface EmployeeDashboardProps {
  onBack: () => void;
}

// Моковые данные сотрудника
const mockEmployee = {
  name: "Иван Петров",
  department: "IT-отдел",
  position: "Разработчик",
  dailyHours: 8,
  currentTasks: [
    {
      id: 1,
      title: "Исправить баг в модуле авторизации",
      priority: "high" as const,
      type: "urgent" as const,
      dueDate: "2025-01-07",
      status: "in-progress" as const
    },
    {
      id: 2,
      title: "Написать документацию к API",
      priority: "medium" as const,
      type: "daily" as const,
      dueDate: "2025-01-07",
      status: "pending" as const
    },
    {
      id: 3,
      title: "Провести код-ревью",
      priority: "low" as const,
      type: "long-term" as const,
      dueDate: "2025-01-10",
      status: "pending" as const
    }
  ]
};

const EmployeeDashboard = ({ onBack }: EmployeeDashboardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
          <Button variant="outline" onClick={onBack}>
            Назад
          </Button>
        </div>

        {/* Профиль сотрудника */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-corporate-blue/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-corporate-blue" />
              </div>
              <div>
                <CardTitle className="text-xl">{mockEmployee.name}</CardTitle>
                <CardDescription>
                  {mockEmployee.position} • {mockEmployee.department}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Рабочий день: {mockEmployee.dailyHours} часов
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Трекер задач и времени */}
        <TaskTracker dailyHours={mockEmployee.dailyHours} />
      </div>
    </div>
  );
};

export default EmployeeDashboard;