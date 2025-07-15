import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, Clock, Pause, User } from "lucide-react";
import TaskTracker from "@/components/TaskTracker";
import { TaskCalendar } from "@/components/TaskCalendar";
import { EditProfileNameDialog } from "@/components/EditProfileNameDialog";
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
          <Button variant="outline" onClick={onBack}>
            Назад
          </Button>
        </div>

        {/* Профиль сотрудника */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-corporate-blue/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-corporate-blue" />
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

        {/* Основная сетка */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Трекер задач и времени */}
          <TaskTracker dailyHours={employee.dailyHours} employeeId={employeeId} />
          
          {/* Календарь задач */}
          <TaskCalendar employeeId={employeeId} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;