import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Archive, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

interface ArchivedTask {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string;
  assignee_name: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'daily' | 'long-term' | 'urgent';
  due_date: string | null;
  status: string;
  department: string;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
}

interface TaskArchiveProps {
  currentUserId?: string;
}

export const TaskArchive = ({ currentUserId = "" }: TaskArchiveProps) => {
  const [archivedTasks, setArchivedTasks] = useState<ArchivedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchArchivedTasks();
  }, []);

  const fetchArchivedTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name)
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const formattedTasks: ArchivedTask[] = data?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        assignee_id: task.assignee_id,
        assignee_name: task.assignee?.full_name || 'Не назначен',
        priority: task.priority as 'low' | 'medium' | 'high',
        task_type: task.task_type as 'daily' | 'long-term' | 'urgent',
        due_date: task.due_date,
        status: task.status,
        department: task.department,
        completed_at: task.completed_at,
        archived_at: task.archived_at,
        created_at: task.created_at
      })) || [];

      setArchivedTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching archived tasks:', error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось загрузить архив задач", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'pending',
          completed_at: null,
          archived: false,
          archived_at: null
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({ 
        title: "Успешно", 
        description: "Задача восстановлена из архива" 
      });
      
      fetchArchivedTasks();
    } catch (error) {
      console.error('Error restoring task:', error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось восстановить задачу", 
        variant: "destructive" 
      });
    }
  };

  const archiveTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({ 
        title: "Успешно", 
        description: "Задача перенесена в архив" 
      });
      
      fetchArchivedTasks();
    } catch (error) {
      console.error('Error archiving task:', error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось архивировать задачу", 
        variant: "destructive" 
      });
    }
  };

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

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Сегодня';
    if (isYesterday(date)) return 'Вчера';
    return format(date, 'dd.MM.yyyy', { locale: ru });
  };

  const filteredTasks = archivedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.assignee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterPeriod === "all") return matchesSearch;
    
    const completedDate = task.completed_at ? parseISO(task.completed_at) : null;
    const now = new Date();
    
    switch (filterPeriod) {
      case "today":
        return matchesSearch && completedDate && isToday(completedDate);
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return matchesSearch && completedDate && completedDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return matchesSearch && completedDate && completedDate >= monthAgo;
      default:
        return matchesSearch;
    }
  });

  // Группировка задач по дням
  const groupedTasks = filteredTasks.reduce((groups, task) => {
    const date = task.completed_at ? getDateLabel(task.completed_at) : 'Без даты';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {} as Record<string, ArchivedTask[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Загрузка архива...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Архив выполненных задач
          </CardTitle>
          <CardDescription>
            Просмотр и управление выполненными задачами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Поиск в архиве..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все время</SelectItem>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {Object.entries(groupedTasks).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery ? "Архивные задачи не найдены" : "Архив пуст"}
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedTasks).map(([date, tasks]) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="text-lg text-corporate-blue">{date}</CardTitle>
              <CardDescription>{tasks.length} задач(и)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-2">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {task.assignee_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {task.due_date ? format(parseISO(task.due_date), 'dd.MM.yyyy') : 'Не установлен'}
                          </div>
                          <span>{task.department}</span>
                          {task.completed_at && (
                            <span>
                              Выполнено: {format(parseISO(task.completed_at), 'dd.MM.yyyy HH:mm')}
                            </span>
                          )}
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
                          {getTypeLabel(task.task_type)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreTask(task.id)}
                          className="text-corporate-blue hover:text-corporate-blue"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Восстановить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};