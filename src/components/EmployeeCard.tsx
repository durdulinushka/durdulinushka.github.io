import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { DeleteEmployeeDialog } from "./DeleteEmployeeDialog";
import { EmployeePlanDialog } from "./EmployeePlanDialog";
import { EditEmployeeNameDialog } from "./EditEmployeeNameDialog";
import { ManageAdminRoleDialog } from "./ManageAdminRoleDialog";

interface Employee {
  id: string;
  full_name: string;
  department: string;
  position: string;
  daily_hours: number;
  email: string;
  role?: string;
}

interface EmployeeCardProps {
  employee: Employee;
  onEmployeeDeleted: () => void;
  onPlanUpdated: () => void;
  onEmployeeUpdated: () => void;
}

export const EmployeeCard = ({ employee, onEmployeeDeleted, onPlanUpdated, onEmployeeUpdated }: EmployeeCardProps) => {
  return (
    <Card key={employee.id} className="animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to={`/employee/${employee.id}`}
              className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <User className="w-6 h-6 text-primary" />
            </Link>
            <div>
              <Link 
                to={`/employee/${employee.id}`}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                <h3 className="font-semibold">{employee.full_name}</h3>
              </Link>
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
              <Badge variant={employee.role === 'admin' ? "default" : "secondary"}>
                {employee.role === 'admin' ? 'Администратор' : 'Сотрудник'}
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
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ 
                    width: `0%` 
                  }}
                />
              </div>
            </div>

            {/* Действия */}
            <div className="flex gap-2">
              <EditEmployeeNameDialog
                employeeId={employee.id}
                currentName={employee.full_name}
                onNameUpdated={onEmployeeUpdated}
              />
              <ManageAdminRoleDialog
                employeeId={employee.id}
                employeeName={employee.full_name}
                currentRole={employee.role || 'employee'}
                onRoleUpdated={onEmployeeUpdated}
              />
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