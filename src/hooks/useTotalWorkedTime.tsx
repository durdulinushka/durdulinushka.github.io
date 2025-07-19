import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTotalWorkedTime = (employeeId: string) => {
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (!employeeId) return;

    const calculateTotalTime = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Получаем все завершенные задачи за сегодня
        const { data: finishedTasks } = await supabase
          .from('time_tracking')
          .select('total_hours')
          .eq('employee_id', employeeId)
          .eq('date', today)
          .eq('status', 'finished');

        // Получаем активные задачи
        const { data: activeTasks } = await supabase
          .from('time_tracking')
          .select('start_time, pause_duration, total_hours, status')
          .eq('employee_id', employeeId)
          .eq('date', today)
          .in('status', ['working', 'paused']);

        let total = 0;

        // Добавляем время завершенных задач
        (finishedTasks || []).forEach(task => {
          total += (task.total_hours || 0) * 60 * 60 * 1000;
        });

        // Добавляем время активных задач
        (activeTasks || []).forEach(task => {
          if (task.status === 'paused') {
            // Для задач на паузе используем total_hours
            total += (task.total_hours || 0) * 60 * 60 * 1000;
          } else if (task.status === 'working' && task.start_time) {
            // Для работающих задач считаем реальное время
            const startTime = new Date(task.start_time).getTime();
            const now = Date.now();
            const pauseDuration = (task.pause_duration || 0) * 60 * 1000;
            const workedTime = now - startTime - pauseDuration;
            total += Math.max(0, workedTime);
          }
        });

        setTotalTime(total);
      } catch (error) {
        console.error('Error calculating total time:', error);
      }
    };

    calculateTotalTime();
    
    // Обновляем каждую секунду
    const interval = setInterval(calculateTotalTime, 1000);
    
    return () => clearInterval(interval);
  }, [employeeId]);

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
  };

  return {
    totalTime,
    formattedTime: formatTime(totalTime)
  };
};