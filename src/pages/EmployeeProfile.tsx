import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, Phone, Clock, Calendar } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import EmployeeHoursStats from "@/components/EmployeeHoursStats";
import EmployeeHoursCalendar from "@/components/EmployeeHoursCalendar";
import EmployeeTaskCalendar from "@/components/EmployeeTaskCalendar";

interface EmployeeProfile {
  id: string;
  full_name: string;
  email: string;
  department: string;
  position: string;
  daily_hours: number;
  avatar_url?: string;
}

const EmployeeProfile = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      loadEmployeeProfile();
    }
  }, [employeeId]);

  const loadEmployeeProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee profile:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профиль сотрудника",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Сотрудник не найден</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Профиль сотрудника</h1>
              <p className="text-muted-foreground">Детальная информация и статистика</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Employee Info */}
        <Card className="dashboard-card">
          <CardHeader>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                {employee.avatar_url ? (
                  <img 
                    src={employee.avatar_url} 
                    alt={employee.full_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{employee.full_name}</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{employee.position}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Норма: {employee.daily_hours} часов/день</span>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant="outline">{employee.department}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Hours Statistics */}
        <EmployeeHoursStats employeeId={employee.id} />

        {/* Task Calendar */}
        <EmployeeTaskCalendar employeeId={employee.id} />

        {/* Hours Calendar */}
        <EmployeeHoursCalendar employeeId={employee.id} />
      </div>
    </div>
  );
};

export default EmployeeProfile;