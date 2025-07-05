import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { User, Clock, Calendar } from "lucide-react";

interface Employee {
  id: number;
  name: string;
  department: string;
  position: string;
  dailyHours: number;
  status: 'working' | 'paused' | 'offline';
  todayHours: number;
  email: string;
}

// Моковые данные сотрудников
const mockEmployees: Employee[] = [
  {
    id: 1,
    name: "Иван Петров",
    department: "IT-отдел",
    position: "Разработчик",
    dailyHours: 8,
    status: "working",
    todayHours: 6.5,
    email: "ivan.petrov@company.com"
  },
  {
    id: 2,
    name: "Мария Иванова",
    department: "Дизайн",
    position: "UI/UX Дизайнер",
    dailyHours: 8,
    status: "paused",
    todayHours: 4.2,
    email: "maria.ivanova@company.com"
  },
  {
    id: 3,
    name: "Алексей Сидоров",
    department: "Маркетинг",
    position: "Менеджер по маркетингу",
    dailyHours: 8,
    status: "offline",
    todayHours: 8,
    email: "alexey.sidorov@company.com"
  },
  {
    id: 4,
    name: "Елена Козлова",
    department: "HR",
    position: "HR-специалист",
    dailyHours: 8,
    status: "working",
    todayHours: 5.8,
    email: "elena.kozlova@company.com"
  }
];

const EmployeeList = () => {
  const [employees] = useState(mockEmployees);
  const [searchQuery, setSearchQuery] = useState("");

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
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <Button variant="corporate">
              Добавить сотрудника
            </Button>
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
                    <h3 className="font-semibold">{employee.name}</h3>
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
                    <Badge className={`${getStatusColor(employee.status)} text-white`}>
                      {getStatusLabel(employee.status)}
                    </Badge>
                  </div>

                  {/* Рабочие часы */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{employee.todayHours}ч / {employee.dailyHours}ч</span>
                    </div>
                    <div className="w-20 bg-muted rounded-full h-2 mt-1">
                      <div 
                        className="bg-corporate-blue h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((employee.todayHours / employee.dailyHours) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Настроить план
                    </Button>
                    <Button variant="outline" size="sm">
                      Назначить задачу
                    </Button>
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