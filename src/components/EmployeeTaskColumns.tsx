import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Clock, User, AlertCircle, CheckCircle, Calendar, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EmployeeTaskColumnsProps {
  employeeId?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  task_type: string;
  due_date?: string;
  assignee?: {
    full_name: string;
    id: string;
  };
}

interface TaskColumn {
  type: 'daily' | 'long-term' | 'urgent';
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  isOpen: boolean;
  color: string;
}

const EmployeeTaskColumns = ({ employeeId }: EmployeeTaskColumnsProps) => {
  const [columns, setColumns] = useState<TaskColumn[]>([
    {
      type: 'daily',
      title: 'Ежедневные задачи',
      icon: <Calendar className="w-5 h-5" />,
      tasks: [],
      isOpen: true,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      type: 'long-term',
      title: 'Долгосрочные задачи',
      icon: <Clock className="w-5 h-5" />,
      tasks: [],
      isOpen: true,
      color: 'bg-green-50 border-green-200'
    },
    {
      type: 'urgent',
      title: 'Срочные задачи',
      icon: <AlertCircle className="w-5 h-5" />,
      tasks: [],
      isOpen: true,
      color: 'bg-red-50 border-red-200'
    }
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [employeeId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          task_type,
          due_date,
          assignee_id,
          profiles!tasks_assignee_id_fkey (
            id,
            full_name
          )
        `)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('assignee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      // Преобразуем данные для соответствия интерфейсу
      const transformedData = data?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        task_type: task.task_type,
        due_date: task.due_date,
        assignee: task.profiles ? {
          id: task.profiles.id,
          full_name: task.profiles.full_name
        } : undefined
      })) || [];

      // Группируем задачи по типам
      const groupedTasks = {
        daily: transformedData.filter(task => task.task_type === 'daily'),
        'long-term': transformedData.filter(task => task.task_type === 'long-term'),
        urgent: transformedData.filter(task => task.task_type === 'urgent')
      };

      // Обновляем колонки с задачами
      setColumns(prev => prev.map(column => ({
        ...column,
        tasks: groupedTasks[column.type] || []
      })));

    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (columnType: 'daily' | 'long-term' | 'urgent') => {
    setColumns(prev => prev.map(column => 
      column.type === columnType 
        ? { ...column, isOpen: !column.isOpen }
        : column
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Выполнена';
      case 'in-progress':
      case 'in_progress':
        return 'В работе';
      case 'pending':
        return 'Ожидает';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return priority;
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

      if (error) {
        console.error('Error updating task status:', error);
        return;
      }

      // Обновляем задачи
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => (
        <Card key={column.type} className={`${column.color} transition-all duration-200`}>
          <Collapsible
            open={column.isOpen}
            onOpenChange={() => toggleColumn(column.type)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-black/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {column.icon}
                    <CardTitle className="text-lg">{column.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {column.tasks.length}
                    </Badge>
                    {column.isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent>
                {column.tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Нет задач</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {column.tasks.map((task) => (
                      <Card key={task.id} className="bg-white/50 border-white/20 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateTaskStatus(task.id, 
                                    task.status === 'completed' ? 'pending' : 'completed'
                                  )}
                                >
                                  <CheckCircle className={`w-4 h-4 ${
                                    task.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                                  }`} />
                                </Button>
                              </div>
                            </div>
                            
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-muted-foreground/60 mb-1">Статус</span>
                                  <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                    {getStatusLabel(task.status)}
                                  </Badge>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-muted-foreground/60 mb-1">Приоритет</span>
                                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority)}
                                  </Badge>
                                </div>
                              </div>
                              
                              {task.due_date && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(task.due_date), 'dd.MM', { locale: ru })}
                                </div>
                              )}
                            </div>
                            
                            {task.assignee && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span className="truncate">{task.assignee.full_name}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
};

export default EmployeeTaskColumns;