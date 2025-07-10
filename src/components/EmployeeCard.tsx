import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock } from "lucide-react";
import { DeleteEmployeeDialog } from "./DeleteEmployeeDialog";
import { EmployeePlanDialog } from "./EmployeePlanDialog";

interface Employee {
  id: string;
  full_name: string;
  department: string;
  position: string;
  daily_hours: number;
  email: string;
}

interface EmployeeCardProps {
  employee: Employee;
  onEmployeeDeleted: () => void;
  onPlanUpdated: () => void;
}

export const EmployeeCard = ({ employee, onEmployeeDeleted, onPlanUpdated }: EmployeeCardProps) => {
  return (
    <Card key={employee.id} className="animate-fade-in">
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
              <EmployeePlanDialog 
                employee={employee}
                onPlanUpdated={onPlanUpdated}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => alert(`Назначение задачи для ${employee.full_name}`)}
                className="hover-scale"
              >
                Назначить задачу
              </Button>
              <DeleteEmployeeDialog 
                employeeId={employee.id}
                employeeName={employee.full_name}
                onEmployeeDeleted={onEmployeeDeleted}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};