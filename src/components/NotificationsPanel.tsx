import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Clock, MessageSquare, FileText, Users, Briefcase, CheckCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Notification {
  id: string;
  type: 'deadline' | 'message' | 'material' | 'project' | 'task' | 'general';
  title: string;
  description: string;
  created_at: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationsPanelProps {
  currentUserId: string | null;
}

export const NotificationsPanel = ({ currentUserId }: NotificationsPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-4 h-4 text-red-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'material':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'project':
        return <Briefcase className="w-4 h-4 text-purple-500" />;
      case 'task':
        return <CheckCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'deadline':
        return 'border-l-red-500';
      case 'message':
        return 'border-l-blue-500';
      case 'material':
        return 'border-l-green-500';
      case 'project':
        return 'border-l-purple-500';
      case 'task':
        return 'border-l-orange-500';
      default:
        return 'border-l-gray-500';
    }
  };

  // Загрузка уведомлений
  const fetchNotifications = async () => {
    if (!currentUserId) return;

    // Создаем моковые уведомления для демонстрации
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'deadline',
        title: 'Приближается дедлайн',
        description: 'Задача "Создание задачника" должна быть завершена завтра',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 минут назад
        read: false
      },
      {
        id: '2',
        type: 'task',
        title: 'Новая задача назначена',
        description: 'Вам назначена задача "Пост для тг. Bustmarket"',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 часа назад
        read: false
      },
      {
        id: '3',
        type: 'material',
        title: 'Новый материал добавлен',
        description: 'В раздел "Материалы" добавлен документ "Инструкция по работе"',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 часа назад
        read: true
      },
      {
        id: '4',
        type: 'project',
        title: 'Добавлены в проект',
        description: 'Вы добавлены в проект "Изучение и создание контент завода"',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 день назад
        read: true
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  // Отметить уведомление как прочитанное
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Отметить все как прочитанные
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Удалить уведомление
  const removeNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    // Подписка на новые задачи
    const tasksChannel = supabase
      .channel('notifications-tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          const newTask = payload.new as any;
          if (newTask.assignee_id === currentUserId) {
            const newNotification: Notification = {
              id: `task-${newTask.id}`,
              type: 'task',
              title: 'Новая задача назначена',
              description: `Вам назначена задача "${newTask.title}"`,
              created_at: new Date().toISOString(),
              read: false
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            toast({
              title: "Новая задача",
              description: `Вам назначена задача "${newTask.title}"`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    // Подписка на новые материалы
    const materialsChannel = supabase
      .channel('notifications-materials')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'materials'
        },
        async (payload) => {
          const newMaterial = payload.new as any;
          
          // Получаем информацию о загрузившем
          const { data: uploaderData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMaterial.uploader_id)
            .single();

          const newNotification: Notification = {
            id: `material-${newMaterial.id}`,
            type: 'material',
            title: 'Новый материал добавлен',
            description: `${uploaderData?.full_name || 'Пользователь'} добавил материал "${newMaterial.title}"`,
            created_at: new Date().toISOString(),
            read: false
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(materialsChannel);
    };
  }, [currentUserId]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="bottom">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Уведомления</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Отметить все
                </Button>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Нет уведомлений</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 ${getNotificationColor(notification.type)} hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="space-y-1 flex-1">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(notification.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};