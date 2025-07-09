import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { User, Clock, Calendar } from "lucide-react";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { DeleteEmployeeDialog } from "./DeleteEmployeeDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  full_name: string;
  department: string;
  position: string;
  daily_hours: number;
  email: string;
}

const EmployeeList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        throw error;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список сотрудников",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEmployeeAdded = () => {
    fetchEmployees();
  };

  const handleEmployeeDeleted = () => {
    fetchEmployees();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-corporate-green';
      case 'paused':
        return 'bg-corporate-orange';
      case 'offline':
        return 'bg-muted';
      default:
        return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'working':
        return 'В работе';
      case 'paused':
        return 'На паузе';
      case 'offline':
        return 'Не в сети';
      default:
        return status;
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Поиск и фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>Управление сотрудниками</CardTitle>
          <CardDescription>
            Просмотр и управление сотрудниками компании
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Поиск сотрудников..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <AddEmployeeDialog onEmployeeAdded={handleEmployeeAdded} />
          </div>
        </CardContent>
      </Card>

      {/* Список сотрудников */}
      <div className="grid gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-corporate-blue/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-corporate-blue" />
                  </div>
                   <div>
                     <h3 className="font-semibold">{employee.full_name}</h3>
                     <p className="text-sm text-muted-foreground">
                       {employee.position} • {employee.department}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {employee.email}
                     </p>
                   </div>
                 </div>

                 <div className="flex items-center gap-6">
                   {/* Статус */}
                   <div className="text-center">
                     <Badge variant="secondary">
                       Сотрудник
                     </Badge>
                   </div>

                   {/* Рабочие часы */}
                   <div className="text-center">
                     <div className="flex items-center gap-1 text-sm">
                       <Clock className="w-4 h-4" />
                       <span>0ч / {employee.daily_hours || 8}ч</span>
                     </div>
                     <div className="w-20 bg-muted rounded-full h-2 mt-1">
                       <div 
                         className="bg-corporate-blue h-2 rounded-full transition-all"
                         style={{ 
                           width: `0%` 
                         }}
                       />
                     </div>
                   </div>

                   {/* Действия */}
                   <div className="flex gap-2">
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => alert(`Настройка плана для ${employee.full_name}`)}
                     >
                       Настроить план
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => alert(`Назначение задачи для ${employee.full_name}`)}
                     >
                       Назначить задачу
                     </Button>
                     <DeleteEmployeeDialog 
                       employeeId={employee.id}
                       employeeName={employee.full_name}
                       onEmployeeDeleted={handleEmployeeDeleted}
                     />
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Сотрудники не найдены
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeList;