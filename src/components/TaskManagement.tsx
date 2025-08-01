import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, User, Bell, Upload, MessageSquare, Edit, Archive, Eye, EyeOff, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditTaskDialog } from "./EditTaskDialog";
import { TaskArchive } from "./TaskArchive";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string;
  assignee_name: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'daily' | 'long-term' | 'urgent';
  start_date: string | null;
  due_date: string | null;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  department: string;
  created_at: string;
  viewed_by: string[];
  archived: boolean;
  completed_at?: string | null;
  total_hours?: number | null;
}

interface Profile {
  id: string;
  full_name: string;
  department: string;
  position: string;
}

const TaskManagement = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignee_id: "",
    priority: "medium",
    task_type: "daily",
    due_date: "",
    department: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    updateOverdueTasks();
    fetchTasks();
    fetchProfiles();
    fetchOverdueStats();
  }, []);

  const updateOverdueTasks = async () => {
    try {
      const { error } = await supabase.rpc('update_overdue_tasks');
      if (error) {
        console.error('Error updating overdue tasks:', error);
      }
    } catch (error) {
      console.error('Error updating overdue tasks:', error);
    }
  };

  const fetchOverdueStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_overdue_stats');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setOverdueStats({
          total_overdue: Number(data[0].total_overdue) || 0,
          overdue_urgent: Number(data[0].overdue_urgent) || 0,
          overdue_long_term: Number(data[0].overdue_long_term) || 0,
          days_overdue_avg: Number(data[0].days_overdue_avg) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching overdue stats:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name),
          time_tracking(total_hours)
        `)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTasks: Task[] = data?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        assignee_id: task.assignee_id,
        assignee_name: task.assignee?.full_name || 'Не назначен',
        priority: task.priority as 'low' | 'medium' | 'high',
        task_type: task.task_type as 'daily' | 'long-term' | 'urgent',
        start_date: task.start_date,
        due_date: task.due_date,
        status: task.status as 'pending' | 'in-progress' | 'completed' | 'overdue',
        department: task.department,
        created_at: task.created_at,
        viewed_by: Array.isArray(task.viewed_by) ? task.viewed_by.map(id => String(id)) : [],
        archived: task.archived || false,
        completed_at: task.completed_at,
        total_hours: task.status === 'completed' && task.time_tracking?.[0]?.total_hours 
          ? task.time_tracking[0].total_hours 
          : null
      })) || [];

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить задачи", variant: "destructive" });
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.assignee_id || !newTask.due_date) {
      toast({ title: "Ошибка", description: "Заполните все обязательные поля: название, исполнитель и дедлайн", variant: "destructive" });
      return;
    }

    try {
      const selectedProfile = profiles.find(p => p.id === newTask.assignee_id);
      
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
          creator_id: (await supabase.auth.getUser()).data.user?.id || null,
          department: selectedProfile?.department || newTask.department
        }]);

      if (error) throw error;

      toast({ title: "Успех", description: "Задача создана успешно" });
      setShowCreateForm(false);
      setNewTask({
        title: "",
        description: "",
        assignee_id: "",
        priority: "medium",
        task_type: "daily",
        due_date: "",
        department: ""
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: "Ошибка", description: "Не удалось создать задачу", variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({ title: "Успех", description: "Статус задачи обновлен" });
      fetchTasks();
      fetchOverdueStats();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({ title: "Ошибка", description: "Не удалось обновить статус", variant: "destructive" });
    }
  };

  const archiveCompletedTasks = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('status', 'completed')
        .eq('archived', false);

      if (error) throw error;

      toast({ title: "Успех", description: "Все выполненные задачи перемещены в архив" });
      fetchTasks();
    } catch (error) {
      console.error('Error archiving completed tasks:', error);
      toast({ title: "Ошибка", description: "Не удалось архивировать задачи", variant: "destructive" });
    }
  };

  const duplicateDailyTasks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('duplicate-daily-tasks', {
        body: { source: 'manual' }
      });

      if (error) throw error;

      toast({ 
        title: "Успех", 
        description: `Дублировано ${data.duplicated} ежедневных задач` 
      });
      fetchTasks();
    } catch (error) {
      console.error('Error duplicating daily tasks:', error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось дублировать ежедневные задачи", 
        variant: "destructive" 
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-corporate-blue';
      case 'medium':
        return 'bg-corporate-teal';
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
      case 'overdue':
        return 'Просрочено';
      default:
        return status;
    }
  };

  const formatTime = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const displayHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    if (displayHours > 0) {
      return `${displayHours}ч ${remainingMinutes}м`;
    }
    return `${remainingMinutes}м`;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.assignee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || task.status === filterStatus;
    const matchesDepartment = filterDepartment === "all" || task.department === filterDepartment;
    
    return matchesSearch && matchesFilter && matchesDepartment;
  });

  // Получаем уникальные отделы из задач
  const uniqueDepartments = Array.from(new Set(tasks.map(task => task.department)));

  const [overdueStats, setOverdueStats] = useState<{
    total_overdue: number;
    overdue_urgent: number;
    overdue_long_term: number;
    days_overdue_avg: number;
  }>({
    total_overdue: 0,
    overdue_urgent: 0,
    overdue_long_term: 0,
    days_overdue_avg: 0
  });

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-corporate-blue">{taskStats.total}</div>
            <div className="text-sm text-muted-foreground">Всего задач</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-corporate-sage">{taskStats.pending}</div>
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
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
            <div className="text-sm text-muted-foreground">Просрочено</div>
          </CardContent>
        </Card>
      </div>

      {/* Детальная статистика просроченных задач */}
      {overdueStats.total_overdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Статистика просроченных задач
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{overdueStats.overdue_urgent}</div>
                <div className="text-sm text-red-700">Срочных просрочено</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{overdueStats.overdue_long_term}</div>
                <div className="text-sm text-red-700">Долгосрочных просрочено</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{Math.round(overdueStats.days_overdue_avg)}</div>
                <div className="text-sm text-red-700">Среднее просрочено дней</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={duplicateDailyTasks}
                title="Дублировать все выполненные ежедневные задачи с вчерашней даты на сегодня"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Дублировать ежедневные
              </Button>
              {taskStats.completed > 0 && (
                <Button 
                  variant="outline" 
                  onClick={archiveCompletedTasks}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Архивировать выполненные ({taskStats.completed})
                </Button>
              )}
              <Button 
                variant="corporate" 
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать задачу
              </Button>
            </div>
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
                <SelectItem value="overdue">Просрочено</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Фильтр по отделу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все отделы</SelectItem>
                {uniqueDepartments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
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
                <Input 
                  placeholder="Название задачи" 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
                <Textarea 
                  placeholder="Описание задачи" 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={newTask.assignee_id} onValueChange={(value) => setNewTask({...newTask, assignee_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Исполнитель" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name} - {profile.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Приоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="low">Низкий</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newTask.task_type} onValueChange={(value) => setNewTask({...newTask, task_type: value})}>
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Дедлайн (обязательно) <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="date" 
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                    required
                  />
                </div>
                <Input 
                  placeholder="Отдел" 
                  value={newTask.department}
                  onChange={(e) => setNewTask({...newTask, department: e.target.value})}
                />
                <div className="flex gap-2">
                  <Button variant="corporate" onClick={createTask}>Создать задачу</Button>
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
                          {task.assignee_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : 'Не установлен'}
                        </div>
                        <span>{task.department}</span>
                        {task.status === 'completed' && task.total_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Потрачено: {formatTime(task.total_hours)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 ml-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground/60">Приоритет</span>
                    <Badge 
                      className={`${getPriorityColor(task.priority)} text-white border-transparent`}
                    >
                      {task.priority === 'high' ? 'Высокий' : 
                       task.priority === 'medium' ? 'Средний' : 'Низкий'}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground/60">Тип</span>
                    <Badge variant="outline">
                      {getTypeLabel(task.task_type)}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground/60">Статус</span>
                    <Badge 
                      className={
                        task.status === 'completed' ? 'bg-corporate-green text-white' :
                        task.status === 'in-progress' ? 'bg-corporate-blue text-white' :
                        'bg-corporate-sage text-white'
                      }
                    >
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <Select value={task.status} onValueChange={(value) => updateTaskStatus(task.id, value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ожидает</SelectItem>
                      <SelectItem value="in-progress">В работе</SelectItem>
                      <SelectItem value="completed">Выполнено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingTask(task)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Редактировать
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setShowCommentsDialog(true);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Комментарии
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setShowDocumentsDialog(true);
                    }}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Документы
                  </Button>
                  <DeleteTaskDialog
                    taskId={task.id}
                    taskTitle={task.title}
                    onTaskDeleted={fetchTasks}
                  />
                </div>
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

      {/* Диалог комментариев */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Комментарии к задаче</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Функция комментариев будет реализована в следующем обновлении
            </div>
            <div className="flex gap-2">
              <Textarea placeholder="Добавить комментарий..." className="flex-1" />
              <Button 
                variant="corporate" 
                size="sm"
                onClick={() => alert('Комментарий отправлен')}
              >
                Отправить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог документов */}
      <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Документы задачи</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Функция загрузки документов будет реализована в следующем обновлении
            </div>
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Перетащите файлы сюда или нажмите для выбора</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => alert('Функция выбора файлов будет реализована')}
              >
                Выбрать файлы
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования задачи */}
      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
        onUpdate={() => {
          fetchTasks();
          setEditingTask(null);
        }}
        profiles={profiles}
      />
    </div>
  );
};

export default TaskManagement;