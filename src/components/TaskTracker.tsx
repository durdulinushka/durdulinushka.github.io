import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TaskAcceptance from "./TaskAcceptance";
import ActiveTaskTracker from "./ActiveTaskTracker";
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
}

interface TaskTrackerProps {
  dailyHours: number;
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

const TaskTracker = ({ dailyHours }: TaskTrackerProps) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [timeRecord, setTimeRecord] = useState<TimeTrackingRecord | null>(null);
  const [workStatus, setWorkStatus] = useState<'not-started' | 'working' | 'paused' | 'finished'>('not-started');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [pauseStart, setPauseStart] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Обновление текущего времени каждую секунду
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Загрузка задач и инициализация трекинга
  useEffect(() => {
    loadTasks();
    initializeTimeTracking();
  }, []);

  const loadTasks = async () => {
    try {
      // Получаем первого сотрудника для демонстрации
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (profileError || !profiles.length) return;

      const employeeId = profiles[0].id;

      // Загружаем задачи назначенные этому сотруднику
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', employeeId)
        .eq('status', 'pending');

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить задачи", variant: "destructive" });
    }
  };

  const initializeTimeTracking = async () => {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (profileError || !profiles.length) return;

      const currentEmployeeId = profiles[0].id;
      const today = new Date().toISOString().split('T')[0];

      // Проверяем активную запись времени
      let { data: existingRecord, error: fetchError } = await supabase
        .from('time_tracking')
        .select('*')
        .eq('employee_id', currentEmployeeId)
        .eq('date', today)
        .in('status', ['working', 'paused'])
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingRecord) {
        const typedRecord: TimeTrackingRecord = {
          ...existingRecord,
          task_id: (existingRecord as any).task_id || null,
          status: existingRecord.status as 'not-started' | 'working' | 'paused' | 'finished'
        };
        setTimeRecord(typedRecord);
        setWorkStatus(typedRecord.status);
        
        if (existingRecord.start_time) {
          setStartTime(new Date(existingRecord.start_time));
        }
        
        setPausedTime((existingRecord.pause_duration || 0) * 60 * 1000);

        // Загружаем текущую задачу если есть
        if ((existingRecord as any).task_id) {
          const { data: taskData } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', (existingRecord as any).task_id)
            .single();
          
          if (taskData) setCurrentTask(taskData);
        }
      }
    } catch (error) {
      console.error('Error initializing time tracking:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить данные времени", variant: "destructive" });
    }
  };

  const getWorkedTime = () => {
    if (!startTime) return 0;
    
    const now = currentTime.getTime();
    let totalWorked = now - startTime.getTime();
    
    totalWorked -= pausedTime;
    
    if (pauseStart) {
      totalWorked -= (now - pauseStart.getTime());
    }
    
    return Math.max(0, totalWorked);
  };

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const acceptTask = async (task: Task) => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (!profiles?.length) return;

      const employeeId = profiles[0].id;
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

      setCurrentTask(task);
      setTimeRecord({
        ...newRecord,
        task_id: (newRecord as any).task_id || null,
        status: newRecord.status as 'not-started' | 'working' | 'paused' | 'finished'
      });
      setWorkStatus('working');
      setStartTime(now);
      setPausedTime(0);
      setPauseStart(null);

      // Обновляем список задач
      setTasks(prev => prev.filter(t => t.id !== task.id));

      toast({
        title: "Задача принята!",
        description: `Начата работа над "${task.title}"`,
      });
    } catch (error) {
      console.error('Error accepting task:', error);
      toast({ title: "Ошибка", description: "Не удалось принять задачу", variant: "destructive" });
    }
  };

  const pauseWork = async () => {
    if (!timeRecord || workStatus !== 'working') return;

    try {
      const { error } = await supabase
        .from('time_tracking')
        .update({ status: 'paused' })
        .eq('id', timeRecord.id);

      if (error) throw error;

      setPauseStart(new Date());
      setWorkStatus('paused');
      
      setTimeRecord({
        ...timeRecord,
        status: 'paused'
      });

      toast({
        title: "Работа приостановлена",
        description: "Таймер поставлен на паузу",
      });
    } catch (error) {
      console.error('Error pausing work:', error);
      toast({ title: "Ошибка", description: "Не удалось приостановить работу", variant: "destructive" });
    }
  };

  const resumeWork = async () => {
    if (!timeRecord || workStatus !== 'paused' || !pauseStart) return;

    try {
      const pauseDuration = new Date().getTime() - pauseStart.getTime();
      const newPausedTime = pausedTime + pauseDuration;
      const pauseDurationMinutes = Math.floor(newPausedTime / (1000 * 60));

      const { error } = await supabase
        .from('time_tracking')
        .update({
          status: 'working',
          pause_duration: pauseDurationMinutes
        })
        .eq('id', timeRecord.id);

      if (error) throw error;

      setPausedTime(newPausedTime);
      setPauseStart(null);
      setWorkStatus('working');
      
      setTimeRecord({
        ...timeRecord,
        status: 'working',
        pause_duration: pauseDurationMinutes
      });

      toast({
        title: "Работа возобновлена",
        description: "Таймер продолжает работу",
      });
    } catch (error) {
      console.error('Error resuming work:', error);
      toast({ title: "Ошибка", description: "Не удалось возобновить работу", variant: "destructive" });
    }
  };

  const finishTask = async () => {
    if (!timeRecord || !currentTask) return;

    try {
      let finalPausedTime = pausedTime;
      
      if (pauseStart) {
        const pauseDuration = new Date().getTime() - pauseStart.getTime();
        finalPausedTime += pauseDuration;
        setPauseStart(null);
      }

      const now = new Date().toISOString();
      const totalWorkedMilliseconds = getWorkedTime();
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
        .eq('id', timeRecord.id);

      if (timeError) throw timeError;

      // Завершаем задачу
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: now
        })
        .eq('id', currentTask.id);

      if (taskError) throw taskError;

      setWorkStatus('finished');
      setPausedTime(finalPausedTime);
      
      setTimeRecord({
        ...timeRecord,
        end_time: now,
        status: 'finished',
        total_hours: totalHours
      });

      toast({
        title: "Задача завершена!",
        description: `Время работы: ${formatTime(totalWorkedMilliseconds)}`,
      });

      // Сбрасываем состояние
      setTimeout(() => {
        setCurrentTask(null);
        setWorkStatus('not-started');
        setStartTime(null);
        setPausedTime(0);
        setTimeRecord(null);
        loadTasks(); // Перезагружаем задачи
      }, 2000);
    } catch (error) {
      console.error('Error finishing task:', error);
      toast({ title: "Ошибка", description: "Не удалось завершить задачу", variant: "destructive" });
    }
  };

  const addComment = async (content: string) => {
    if (!currentTask) return;

    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (!profiles?.length) return;

      const { error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: currentTask.id,
          author_id: profiles[0].id,
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

  const uploadDocument = async (file: File) => {
    if (!currentTask) return;

    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (!profiles?.length) return;

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${currentTask.id}/${fileName}`;

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
          task_id: currentTask.id,
          uploader_id: profiles[0].id,
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

  const workedTime = getWorkedTime();

  return (
    <div className="space-y-6">
      {/* Активный трекер задачи */}
      {currentTask && (workStatus === 'working' || workStatus === 'paused') && (
        <>
          <ActiveTaskTracker
            currentTask={currentTask}
            workStatus={workStatus}
            workedTime={workedTime}
            dailyHours={dailyHours}
            onPause={pauseWork}
            onResume={resumeWork}
            onFinish={finishTask}
          />
          <TaskActions
            currentTask={currentTask}
            onAddComment={addComment}
            onUploadDocument={uploadDocument}
          />
        </>
      )}

      {/* Доступные задачи */}
      {workStatus === 'not-started' && (
        <TaskAcceptance
          tasks={tasks}
          onAcceptTask={acceptTask}
        />
      )}
    </div>
  );
};

export default TaskTracker;