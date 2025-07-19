import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Pause, Play, Check, Plus } from "lucide-react";
import TaskAcceptance from "./TaskAcceptance";
import TaskActions from "./TaskActions";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  task_type: string;
  due_date: string | null;
  status: string;
  assignee_id: string;
  department: string;
  completed_at?: string | null;
  total_hours?: number | null;
}

interface ActiveTaskItem {
  task: Task;
  timeRecord: TimeTrackingRecord;
  startTime: Date;
  pausedTime: number;
  pauseStart: Date | null;
  status: 'working' | 'paused';
}

interface TimeTrackingRecord {
  id: string;
  employee_id: string;
  task_id?: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  pause_duration: number;
  total_hours: number;
  status: 'not-started' | 'working' | 'paused' | 'finished';
}

interface MultiTaskTrackerProps {
  dailyHours: number;
  employeeId: string;
}

const MultiTaskTracker = ({ dailyHours, employeeId }: MultiTaskTrackerProps) => {
  const { toast } = useToast();
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTaskItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTaskAcceptance, setShowTaskAcceptance] = useState(false);

  // Обновление текущего времени каждую секунду
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Инициализация при загрузке
  useEffect(() => {
    if (employeeId) {
      loadAvailableTasks();
      loadActiveTasks();
    }
  }, [employeeId]);

  const loadAvailableTasks = async () => {
    try {
      if (!employeeId) return;

      const today = new Date().toISOString().split('T')[0];

      // Сначала получаем ID задач, которые уже в работе
      const { data: activeTimeRecords } = await supabase
        .from('time_tracking')
        .select('task_id')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .in('status', ['working', 'paused'])
        .not('task_id', 'is', null);

      const activeTaskIds = (activeTimeRecords || []).map(record => record.task_id).filter(Boolean);

      // Загружаем все задачи сотрудника
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', employeeId)
        .in('status', ['pending', 'in-progress']);

      if (error) throw error;

      // Фильтруем задачи, исключая те, что уже в работе
      const availableTasks = (allTasks || []).filter(task => !activeTaskIds.includes(task.id));

      console.log('All tasks:', allTasks?.length);
      console.log('Active task IDs:', activeTaskIds);
      console.log('Available tasks:', availableTasks.length);

      setAvailableTasks(availableTasks);
    } catch (error) {
      console.error('Error loading available tasks:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить доступные задачи", variant: "destructive" });
    }
  };

  const loadActiveTasks = async () => {
    try {
      if (!employeeId) return;

      const today = new Date().toISOString().split('T')[0];

      // Загружаем активные записи времени
      const { data: timeRecords, error: timeError } = await supabase
        .from('time_tracking')
        .select(`
          *,
          tasks(*)
        `)
        .eq('employee_id', employeeId)
        .eq('date', today)
        .in('status', ['working', 'paused'])
        .not('task_id', 'is', null);

      if (timeError) throw timeError;

      const activeTaskItems: ActiveTaskItem[] = [];

      for (const record of timeRecords || []) {
        if (record.tasks) {
          const activeItem: ActiveTaskItem = {
            task: record.tasks as Task,
            timeRecord: {
              ...record,
              task_id: record.task_id,
              status: record.status as 'not-started' | 'working' | 'paused' | 'finished'
            },
            startTime: new Date(record.start_time!),
            pausedTime: (record.pause_duration || 0) * 60 * 1000,
            pauseStart: record.status === 'paused' ? new Date() : null,
            status: record.status as 'working' | 'paused'
          };
          activeTaskItems.push(activeItem);
        }
      }

      setActiveTasks(activeTaskItems);
    } catch (error) {
      console.error('Error loading active tasks:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить активные задачи", variant: "destructive" });
    }
  };

  const getWorkedTime = (activeTask: ActiveTaskItem) => {
    const now = currentTime.getTime();
    const taskStartTime = new Date(activeTask.timeRecord.start_time!).getTime();
    
    // Рассчитываем общее время с момента начала задачи
    let totalTime = now - taskStartTime;
    
    // Вычитаем сохраненные паузы из базы данных (в миллисекундах)
    const savedPausesMs = (activeTask.timeRecord.pause_duration || 0) * 60 * 1000;
    totalTime -= savedPausesMs;
    
    // Если задача сейчас на паузе, вычитаем время с момента начала паузы
    if (activeTask.status === 'paused' && activeTask.pauseStart) {
      const currentPauseDuration = now - activeTask.pauseStart.getTime();
      totalTime -= currentPauseDuration;
    }
    
    return Math.max(0, totalTime);
  };

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const acceptTask = async (task: Task) => {
    try {
      if (!employeeId) return;

      const now = new Date();
      const nowISOString = now.toISOString();
      const today = now.toISOString().split('T')[0];

      // Создаем запись трекинга времени
      const { data: newRecord, error } = await supabase
        .from('time_tracking')
        .insert([{
          employee_id: employeeId,
          task_id: task.id,
          date: today,
          start_time: nowISOString,
          status: 'working'
        }])
        .select()
        .single();

      if (error) throw error;

      // Обновляем статус задачи
      await supabase
        .from('tasks')
        .update({ status: 'in-progress' })
        .eq('id', task.id);

      // Добавляем в активные задачи
      const newActiveTask: ActiveTaskItem = {
        task,
        timeRecord: {
          ...newRecord,
          task_id: newRecord.task_id,
          status: newRecord.status as 'not-started' | 'working' | 'paused' | 'finished'
        },
        startTime: now,
        pausedTime: 0,
        pauseStart: null,
        status: 'working'
      };

      setActiveTasks(prev => [...prev, newActiveTask]);
      
      // Убираем из доступных задач
      setAvailableTasks(prev => prev.filter(t => t.id !== task.id));
      setShowTaskAcceptance(false);

      toast({
        title: "Задача принята!",
        description: `Начата работа над "${task.title}"`,
      });
    } catch (error) {
      console.error('Error accepting task:', error);
      toast({ title: "Ошибка", description: "Не удалось принять задачу", variant: "destructive" });
    }
  };

  const pauseTask = async (taskIndex: number) => {
    const activeTask = activeTasks[taskIndex];
    if (!activeTask || activeTask.status !== 'working') return;

    try {
      const { error } = await supabase
        .from('time_tracking')
        .update({ status: 'paused' })
        .eq('id', activeTask.timeRecord.id);

      if (error) throw error;

      setActiveTasks(prev => prev.map((task, index) => 
        index === taskIndex 
          ? { 
              ...task, 
              status: 'paused', 
              pauseStart: new Date(),
              timeRecord: { ...task.timeRecord, status: 'paused' }
            }
          : task
      ));

      toast({
        title: "Задача приостановлена",
        description: `"${activeTask.task.title}" поставлена на паузу`,
      });
    } catch (error) {
      console.error('Error pausing task:', error);
      toast({ title: "Ошибка", description: "Не удалось приостановить задачу", variant: "destructive" });
    }
  };

  const resumeTask = async (taskIndex: number) => {
    const activeTask = activeTasks[taskIndex];
    if (!activeTask || activeTask.status !== 'paused' || !activeTask.pauseStart) return;

    try {
      const pauseDuration = new Date().getTime() - activeTask.pauseStart.getTime();
      const newPausedTime = activeTask.pausedTime + pauseDuration;
      const pauseDurationMinutes = Math.floor(newPausedTime / (1000 * 60));

      const { error } = await supabase
        .from('time_tracking')
        .update({
          status: 'working',
          pause_duration: pauseDurationMinutes
        })
        .eq('id', activeTask.timeRecord.id);

      if (error) throw error;

      setActiveTasks(prev => prev.map((task, index) => 
        index === taskIndex 
          ? { 
              ...task, 
              status: 'working', 
              pausedTime: newPausedTime,
              pauseStart: null,
              timeRecord: { ...task.timeRecord, status: 'working', pause_duration: pauseDurationMinutes }
            }
          : task
      ));

      toast({
        title: "Работа возобновлена",
        description: `Продолжена работа над "${activeTask.task.title}"`,
      });
    } catch (error) {
      console.error('Error resuming task:', error);
      toast({ title: "Ошибка", description: "Не удалось возобновить работу", variant: "destructive" });
    }
  };

  const finishTask = async (taskIndex: number) => {
    const activeTask = activeTasks[taskIndex];
    if (!activeTask) return;

    try {
      let finalPausedTime = activeTask.pausedTime;
      
      if (activeTask.pauseStart && activeTask.status === 'paused') {
        const pauseDuration = new Date().getTime() - activeTask.pauseStart.getTime();
        finalPausedTime += pauseDuration;
      }

      const now = new Date().toISOString();
      const totalWorkedMilliseconds = getWorkedTime(activeTask);
      const totalHours = totalWorkedMilliseconds / (1000 * 60 * 60);

      // Обновляем запись времени
      const { error: timeError } = await supabase
        .from('time_tracking')
        .update({
          end_time: now,
          status: 'finished',
          total_hours: totalHours,
          pause_duration: Math.floor(finalPausedTime / (1000 * 60))
        })
        .eq('id', activeTask.timeRecord.id);

      if (timeError) throw timeError;

      // Завершаем задачу
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: now
        })
        .eq('id', activeTask.task.id);

      if (taskError) throw taskError;

      // Убираем из активных задач
      setActiveTasks(prev => prev.filter((_, index) => index !== taskIndex));

      toast({
        title: "Задача завершена!",
        description: `"${activeTask.task.title}" - Время работы: ${formatTime(totalWorkedMilliseconds)}`,
      });

      // Обновляем доступные задачи
      loadAvailableTasks();
    } catch (error) {
      console.error('Error finishing task:', error);
      toast({ title: "Ошибка", description: "Не удалось завершить задачу", variant: "destructive" });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-corporate-red';
      case 'medium': return 'bg-corporate-orange';
      case 'low': return 'bg-corporate-green';
      default: return 'bg-muted';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  const getStatusBadge = (status: 'working' | 'paused') => {
    switch (status) {
      case 'working':
        return <Badge className="bg-corporate-green animate-pulse">В работе</Badge>;
      case 'paused':
        return <Badge className="bg-corporate-orange">На паузе</Badge>;
      default:
        return null;
    }
  };

  const addComment = async (taskId: string, content: string) => {
    if (!employeeId) return;

    try {
      const { error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          author_id: employeeId,
          content: content
        }]);

      if (error) throw error;

      toast({
        title: "Комментарий добавлен",
        description: "Комментарий успешно сохранен",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ title: "Ошибка", description: "Не удалось добавить комментарий", variant: "destructive" });
    }
  };

  const uploadDocument = async (taskId: string, file: File) => {
    if (!employeeId) return;

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${taskId}/${fileName}`;

      // Загружаем файл в storage
      const { error: uploadError } = await supabase.storage
        .from('task-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('task-documents')
        .getPublicUrl(filePath);

      // Сохраняем информацию о документе
      const { error: dbError } = await supabase
        .from('task_documents')
        .insert([{
          task_id: taskId,
          uploader_id: employeeId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type
        }]);

      if (dbError) throw dbError;

      toast({
        title: "Документ загружен",
        description: "Документ успешно прикреплен к задаче",
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить документ", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления задачи */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Активные задачи</h2>
        <Button
          variant="outline"
          onClick={() => {
            loadAvailableTasks(); // Обновляем список перед показом
            setShowTaskAcceptance(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Принять задачу
        </Button>
      </div>

      {/* Активные задачи */}
      {activeTasks.length > 0 && (
        <div className="space-y-6">
          {activeTasks.map((activeTask, index) => (
            <div key={activeTask.task.id} className="space-y-4">
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{activeTask.task.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {activeTask.task.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${getPriorityColor(activeTask.task.priority)} text-white text-xs`}
                      >
                        {getPriorityLabel(activeTask.task.priority)}
                      </Badge>
                      {getStatusBadge(activeTask.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Таймер */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">
                      {formatTime(getWorkedTime(activeTask))}
                    </div>
                    {activeTask.task.due_date && (
                      <div className="text-sm text-muted-foreground">
                        Срок: {new Date(activeTask.task.due_date).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                  </div>

                  {/* Кнопки управления */}
                  <div className="flex gap-2">
                    {activeTask.status === 'working' && (
                      <Button 
                        variant="warning" 
                        size="sm"
                        onClick={() => pauseTask(index)}
                        className="flex items-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Пауза
                      </Button>
                    )}

                    {activeTask.status === 'paused' && (
                      <Button 
                        variant="corporate" 
                        size="sm"
                        onClick={() => resumeTask(index)}
                        className="flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Продолжить
                      </Button>
                    )}

                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => finishTask(index)}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Завершить
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Действия с задачей (комментарии и документы) */}
              <TaskActions
                currentTask={activeTask.task}
                onAddComment={(content) => addComment(activeTask.task.id, content)}
                onUploadDocument={(file) => uploadDocument(activeTask.task.id, file)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Пустое состояние */}
      {activeTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">Нет активных задач</h3>
            <p className="text-muted-foreground mb-4">
              Примите задачу, чтобы начать работу
            </p>
            <Button onClick={() => {
              loadAvailableTasks();
              setShowTaskAcceptance(true);
            }}>
              Выбрать задачу
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Модальное окно выбора задач */}
      {showTaskAcceptance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Выберите задачу</h3>
              <Button variant="ghost" onClick={() => setShowTaskAcceptance(false)}>
                ✕
              </Button>
            </div>
            <TaskAcceptance
              tasks={availableTasks}
              onAcceptTask={acceptTask}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiTaskTracker;