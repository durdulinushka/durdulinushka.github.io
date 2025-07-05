import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, User, Bell } from "lucide-react";

interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  type: 'daily' | 'long-term' | 'urgent';
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  department: string;
}

// Моковые данные задач
const mockTasks: Task[] = [
  {
    id: 1,
    title: "Исправить баг в модуле авторизации",
    description: "Найти и исправить ошибку валидации пароля",
    assignee: "Иван Петров",
    priority: "high",
    type: "urgent",
    dueDate: "2025-01-07",
    status: "in-progress",
    department: "IT-отдел"
  },
  {
    id: 2,
    title: "Создать макеты для мобильного приложения",
    description: "Разработать UI/UX для основных экранов приложения",
    assignee: "Мария Иванова",
    priority: "medium",
    type: "long-term",
    dueDate: "2025-01-15",
    status: "pending",
    department: "Дизайн"
  },
  {
    id: 3,
    title: "Подготовить отчет по маркетинговой кампании",
    description: "Анализ результатов рекламной кампании в соцсетях",
    assignee: "Алексей Сидоров",
    priority: "medium",
    type: "daily",
    dueDate: "2025-01-07",
    status: "completed",
    department: "Маркетинг"
  }
];

const TaskManagement = () => {
  const [tasks, setTasks] = useState(mockTasks);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-corporate-red';
      case 'medium':
        return 'bg-corporate-orange';
      case 'low':
        return 'bg-corporate-green';
      default:
        return 'bg-muted';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Ежедневная';
      case 'long-term':
        return 'Долгосрочная';
      case 'urgent':
        return 'Срочная';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'in-progress':
        return 'В работе';
      case 'completed':
        return 'Выполнено';
      default:
        return status;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || task.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-corporate-blue">{taskStats.total}</div>
            <div className="text-sm text-muted-foreground">Всего задач</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-corporate-orange">{taskStats.pending}</div>
            <div className="text-sm text-muted-foreground">Ожидают</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-corporate-blue">{taskStats.inProgress}</div>
            <div className="text-sm text-muted-foreground">В работе</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-corporate-green">{taskStats.completed}</div>
            <div className="text-sm text-muted-foreground">Выполнено</div>
          </CardContent>
        </Card>
      </div>

      {/* Управление задачами */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление задачами</CardTitle>
              <CardDescription>
                Создание и распределение задач для сотрудников
              </CardDescription>
            </div>
            <Button 
              variant="corporate" 
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать задачу
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Фильтр по статусу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все задачи</SelectItem>
                <SelectItem value="pending">Ожидают</SelectItem>
                <SelectItem value="in-progress">В работе</SelectItem>
                <SelectItem value="completed">Выполнено</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Форма создания задачи */}
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Новая задача</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Название задачи" />
                <Textarea placeholder="Описание задачи" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Исполнитель" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ivan">Иван Петров</SelectItem>
                      <SelectItem value="maria">Мария Иванова</SelectItem>
                      <SelectItem value="alexey">Алексей Сидоров</SelectItem>
                      <SelectItem value="elena">Елена Козлова</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Приоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="low">Низкий</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Тип задачи" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Срочная</SelectItem>
                      <SelectItem value="daily">Ежедневная</SelectItem>
                      <SelectItem value="long-term">Долгосрочная</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input type="date" placeholder="Срок выполнения" />
                <div className="flex gap-2">
                  <Button variant="corporate">Создать задачу</Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Список задач */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{task.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {task.assignee}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                        </div>
                        <span>{task.department}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Badge 
                    className={`${getPriorityColor(task.priority)} text-white border-transparent`}
                  >
                    {task.priority === 'high' ? 'Высокий' : 
                     task.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </Badge>
                  <Badge variant="outline">
                    {getTypeLabel(task.type)}
                  </Badge>
                  <Badge 
                    className={
                      task.status === 'completed' ? 'bg-corporate-green text-white' :
                      task.status === 'in-progress' ? 'bg-corporate-blue text-white' :
                      'bg-corporate-orange text-white'
                    }
                  >
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm">
                  Редактировать
                </Button>
                <Button variant="outline" size="sm">
                  Комментарии
                </Button>
                <Button variant="outline" size="sm">
                  Документы
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Задачи не найдены
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskManagement;