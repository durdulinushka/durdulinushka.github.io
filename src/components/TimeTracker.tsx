import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Pause, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TimeTrackerProps {
  dailyHours: number;
}

type WorkStatus = 'not-started' | 'working' | 'paused' | 'finished';

const TimeTracker = ({ dailyHours }: TimeTrackerProps) => {
  const { toast } = useToast();
  const [workStatus, setWorkStatus] = useState<WorkStatus>('not-started');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pausedTime, setPausedTime] = useState(0); // общее время пауз в миллисекундах
  const [pauseStart, setPauseStart] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Обновление текущего времени каждую секунду
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const startWork = () => {
    setStartTime(new Date());
    setWorkStatus('working');
    setPausedTime(0);
    setPauseStart(null);
    
    toast({
      title: "Работа начата!",
      description: "Счетчик рабочего времени запущен",
    });
  };

  const pauseWork = () => {
    if (workStatus === 'working') {
      setPauseStart(new Date());
      setWorkStatus('paused');
      
      toast({
        title: "Работа приостановлена",
        description: "Счетчик рабочего времени поставлен на паузу",
      });
    }
  };

  const resumeWork = () => {
    if (workStatus === 'paused' && pauseStart) {
      const pauseDuration = new Date().getTime() - pauseStart.getTime();
      setPausedTime(prev => prev + pauseDuration);
      setPauseStart(null);
      setWorkStatus('working');
      
      toast({
        title: "Работа возобновлена",
        description: "Счетчик рабочего времени продолжает работу",
      });
    }
  };

  const finishWork = () => {
    if (pauseStart) {
      const pauseDuration = new Date().getTime() - pauseStart.getTime();
      setPausedTime(prev => prev + pauseDuration);
      setPauseStart(null);
    }
    
    setWorkStatus('finished');
    const totalWorked = getWorkedTime();
    
    toast({
      title: "Рабочий день завершен!",
      description: `Отработано: ${formatTime(totalWorked)}`,
    });
  };

  const resetWork = () => {
    setWorkStatus('not-started');
    setStartTime(null);
    setPausedTime(0);
    setPauseStart(null);
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