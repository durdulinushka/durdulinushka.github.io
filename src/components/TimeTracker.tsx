import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TimeTrackerProps {
  dailyHours: number;
}

interface TimeTrackingRecord {
  id: string;
  employee_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  pause_duration: number;
  total_hours: number;
  status: 'not-started' | 'working' | 'paused' | 'finished';
  login_time: string;
}

type WorkStatus = 'not-started' | 'working' | 'paused' | 'finished';

const TimeTracker = ({ dailyHours }: TimeTrackerProps) => {
  const { toast } = useToast();
  const [timeRecord, setTimeRecord] = useState<TimeTrackingRecord | null>(null);
  const [workStatus, setWorkStatus] = useState<WorkStatus>('not-started');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [pauseStart, setPauseStart] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Обновление текущего времени каждую секунду
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Инициализация отслеживания времени
  useEffect(() => {
    initializeTimeTracking();
  }, []);

  const initializeTimeTracking = async () => {
    try {
      // Получаем первого сотрудника для демонстрации
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (profileError || !profiles.length) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      const currentEmployeeId = profiles[0].id;
      const today = new Date().toISOString().split('T')[0];

      // Проверяем, есть ли запись за сегодня
      let { data: existingRecord, error: fetchError } = await supabase
        .from('time_tracking')
        .select('*')
        .eq('employee_id', currentEmployeeId)
        .eq('date', today)
        .single();

      if (!existingRecord && fetchError?.code === 'PGRST116') {
        // Создаем новую запись
        const { data: newRecord, error: insertError } = await supabase
          .from('time_tracking')
          .insert([{
            employee_id: currentEmployeeId,
            date: today,
            status: 'not-started'
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        existingRecord = newRecord;
      }

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existingRecord) {
        const typedRecord: TimeTrackingRecord = {
          ...existingRecord,
          status: existingRecord.status as 'not-started' | 'working' | 'paused' | 'finished'
        };
        setTimeRecord(typedRecord);
        setWorkStatus(typedRecord.status);
        
        if (existingRecord.start_time) {
          setStartTime(new Date(existingRecord.start_time));
        }

        // Восстанавливаем время пауз
        setPausedTime(existingRecord.pause_duration * 60 * 1000);
      }
    } catch (error) {
      console.error('Error initializing time tracking:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить данные времени", variant: "destructive" });
    }
  };

  // Расчет отработанного времени
  const getWorkedTime = () => {
    if (!startTime) return 0;
    
    const now = currentTime.getTime();
    let totalWorked = now - startTime.getTime();
    
    // Вычитаем время пауз
    totalWorked -= pausedTime;
    
    // Если сейчас пауза, вычитаем текущее время паузы
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

  const startWork = async () => {
    if (!timeRecord) return;

    try {
      const now = new Date();
      const nowISOString = now.toISOString();

      const { error } = await supabase
        .from('time_tracking')
        .update({
          start_time: nowISOString,
          status: 'working'
        })
        .eq('id', timeRecord.id);

      if (error) throw error;

      setStartTime(now);
      setWorkStatus('working');
      setPausedTime(0);
      setPauseStart(null);
      
      setTimeRecord({
        ...timeRecord,
        start_time: nowISOString,
        status: 'working'
      });

      toast({
        title: "Работа начата!",
        description: "Счетчик рабочего времени запущен",
      });
    } catch (error) {
      console.error('Error starting work:', error);
      toast({ title: "Ошибка", description: "Не удалось начать работу", variant: "destructive" });
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
        description: "Счетчик рабочего времени поставлен на паузу",
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
        description: "Счетчик рабочего времени продолжает работу",
      });
    } catch (error) {
      console.error('Error resuming work:', error);
      toast({ title: "Ошибка", description: "Не удалось возобновить работу", variant: "destructive" });
    }
  };

  const finishWork = async () => {
    if (!timeRecord) return;

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

      const { error } = await supabase
        .from('time_tracking')
        .update({
          end_time: now,
          status: 'finished',
          total_hours: totalHours,
          pause_duration: Math.floor(finalPausedTime / (1000 * 60))
        })
        .eq('id', timeRecord.id);

      if (error) throw error;

      setWorkStatus('finished');
      setPausedTime(finalPausedTime);
      
      setTimeRecord({
        ...timeRecord,
        end_time: now,
        status: 'finished',
        total_hours: totalHours
      });

      toast({
        title: "Рабочий день завершен!",
        description: `Отработано: ${formatTime(totalWorkedMilliseconds)}`,
      });
    } catch (error) {
      console.error('Error finishing work:', error);
      toast({ title: "Ошибка", description: "Не удалось завершить рабочий день", variant: "destructive" });
    }
  };

  const resetWork = () => {
    setWorkStatus('not-started');
    setStartTime(null);
    setPausedTime(0);
    setPauseStart(null);
    // Инициализируем новый день
    initializeTimeTracking();
  };

  const workedTime = getWorkedTime();
  const dailyTarget = dailyHours * 60 * 60 * 1000; // цель в миллисекундах
  const progress = Math.min((workedTime / dailyTarget) * 100, 100);
  const remainingTime = Math.max(0, dailyTarget - workedTime);

  // Статус рабочего дня
  const getStatusBadge = () => {
    switch (workStatus) {
      case 'not-started':
        return <Badge variant="outline">Не начат</Badge>;
      case 'working':
        return <Badge className="bg-corporate-green">В работе</Badge>;
      case 'paused':
        return <Badge className="bg-corporate-orange">На паузе</Badge>;
      case 'finished':
        return <Badge className="bg-corporate-blue">Завершен</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Трекер времени
            </CardTitle>
            <CardDescription>
              Управление рабочим временем
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Таймер */}
        <div className="text-center">
          <div className="text-4xl font-bold text-corporate-blue mb-2">
            {formatTime(workedTime)}
          </div>
          <div className="text-sm text-muted-foreground">
            Цель: {dailyHours} часов ({formatTime(dailyTarget)})
          </div>
          {workStatus !== 'not-started' && (
            <div className="text-sm text-muted-foreground mt-1">
              Осталось: {formatTime(remainingTime)}
            </div>
          )}
        </div>

        {/* Прогресс бар */}
        {workStatus !== 'not-started' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Прогресс</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-corporate-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex gap-2">
          {workStatus === 'not-started' && (
            <>
              <Button 
                variant="corporate" 
                className="flex-1"
                onClick={startWork}
              >
                Приступить к работе
              </Button>
            </>
          )}

          {workStatus === 'working' && (
            <>
              <Button 
                variant="warning" 
                className="flex-1"
                onClick={pauseWork}
              >
                <Pause className="w-4 h-4 mr-2" />
                Поставить на паузу
              </Button>
              <Button 
                variant="success" 
                onClick={finishWork}
              >
                Завершить рабочий день
              </Button>
            </>
          )}

          {workStatus === 'paused' && (
            <>
              <Button 
                variant="corporate" 
                className="flex-1"
                onClick={resumeWork}
              >
                Продолжить работу
              </Button>
              <Button 
                variant="success" 
                onClick={finishWork}
              >
                Завершить рабочий день
              </Button>
            </>
          )}

          {workStatus === 'finished' && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={resetWork}
            >
              Начать новый день
            </Button>
          )}
        </div>

        {/* Информация о времени входа */}
        {startTime && (
          <div className="text-xs text-muted-foreground text-center">
            Начало работы: {startTime.toLocaleTimeString('ru-RU')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeTracker;