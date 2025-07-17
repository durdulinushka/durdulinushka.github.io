import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUnreadMessages = (currentUserId: string | null) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Функция для воспроизведения звука уведомления
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Не удалось воспроизвести звук уведомления:', error);
    }
  };

  // Получение количества непрочитанных сообщений
  const fetchUnreadCount = async () => {
    if (!currentUserId) return;

    try {
      // Получаем все чаты пользователя
      const { data: memberData } = await supabase
        .from('chat_members')
        .select('chat_id, last_read_at')
        .eq('user_id', currentUserId);

      if (!memberData || memberData.length === 0) {
        setUnreadCount(0);
        return;
      }

      let totalUnread = 0;

      // Для каждого чата считаем непрочитанные сообщения
      for (const member of memberData) {
        const { data: messagesData } = await supabase
          .from('messages')
          .select('id')
          .eq('chat_id', member.chat_id)
          .neq('sender_id', currentUserId) // исключаем собственные сообщения
          .gt('created_at', member.last_read_at || '1970-01-01');

        totalUnread += messagesData?.length || 0;
      }

      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Ошибка при подсчете непрочитанных сообщений:', error);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;

    // Первоначальная загрузка
    fetchUnreadCount();

    // Подписываемся на новые сообщения
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Проверяем, является ли пользователь участником этого чата
          const { data: isMember } = await supabase
            .from('chat_members')
            .select('id')
            .eq('chat_id', newMessage.chat_id)
            .eq('user_id', currentUserId)
            .single();

          // Если пользователь участник чата и не автор сообщения
          if (isMember && newMessage.sender_id !== currentUserId) {
            // Получаем информацию об отправителе
            const { data: senderData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMessage.sender_id)
              .single();

            // Получаем название чата
            const { data: chatData } = await supabase
              .from('chats')
              .select('name')
              .eq('id', newMessage.chat_id)
              .single();

            // Воспроизводим звук
            playNotificationSound();

            // Показываем уведомление
            toast({
              title: "Новое сообщение",
              description: `${senderData?.full_name || 'Неизвестный'} в ${chatData?.name || 'чате'}: ${newMessage.content || 'Отправил файл'}`,
              duration: 5000,
            });

            // Обновляем счетчик
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    // Подписываемся на обновления last_read_at
    const readChannel = supabase
      .channel('chat-members-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_members'
        },
        (payload) => {
          const updatedMember = payload.new as any;
          if (updatedMember.user_id === currentUserId) {
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(readChannel);
    };
  }, [currentUserId]);

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
};