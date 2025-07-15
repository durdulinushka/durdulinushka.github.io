import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Task } from "./TaskCalendar";

interface DayCellProps {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onTaskMove: (taskId: string, newDate: string) => void;
}

export const DayCell = ({ date, tasks, isCurrentMonth, isToday, onTaskMove }: DayCellProps) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayNumber = format(date, 'd');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-corporate-red/20 text-red-700 border-red-200';
      case 'medium': return 'bg-corporate-orange/20 text-orange-700 border-orange-200';
      case 'low': return 'bg-corporate-green/20 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in-progress': return '⚡';
      case 'pending': return '⏳';
      default: return '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onTaskMove(taskId, dateStr);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={cn(
        "min-h-[120px] p-2 border rounded-lg transition-colors",
        isCurrentMonth ? "bg-background" : "bg-muted/30",
        isToday && "ring-2 ring-primary ring-offset-2",
        "hover:bg-accent/20"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className={cn(
        "text-sm font-medium mb-2",
        isCurrentMonth ? "text-foreground" : "text-muted-foreground",
        isToday && "text-primary font-bold"
      )}>
        {dayNumber}
      </div>
      
      <div className="space-y-1">
        {tasks.slice(0, 3).map(task => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
            className={cn(
              "text-xs p-1.5 rounded border cursor-move hover:opacity-80 transition-opacity relative",
              getPriorityColor(task.priority)
            )}
            title={`${task.title}${task.description ? '\n' + task.description : ''}`}
          >
            <div className="flex items-center justify-between gap-1">
              <div className="truncate font-medium flex-1">{task.title}</div>
              <span className="text-xs opacity-70">{getStatusIcon(task.status)}</span>
            </div>
            {task.status === 'completed' && (
              <div className="absolute inset-0 bg-muted/20 rounded border-dashed"></div>
            )}
          </div>
        ))}
        
        {tasks.length > 3 && (
          <div className="text-xs text-muted-foreground text-center py-1 bg-muted/30 rounded border border-dashed">
            +{tasks.length - 3} ещё
          </div>
        )}
        
        {tasks.length === 0 && (
          <div className="text-xs text-muted-foreground/50 text-center py-4 border-2 border-dashed border-muted/30 rounded-lg">
            Перетащите задачу
          </div>
        )}
      </div>
    </div>
  );
};