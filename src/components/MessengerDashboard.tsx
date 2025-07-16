import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Plus, Users, Send, Paperclip, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Chat {
  id: string;
  name: string;
  type: string;
  description?: string;
  created_by: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  members?: {
    user_id: string;
    role: string;
    profiles: {
      full_name: string;
    };
  }[];
  last_message?: {
    content: string;
    created_at: string;
    sender: {
      full_name: string;
    };
  };
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to?: string;
  created_at: string;
  sender: {
    full_name: string;
  };
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  department: string;
  position: string;
}

export default function MessengerDashboard() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [user, setUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Chat creation form
  const [newChatName, setNewChatName] = useState("");
  const [newChatType, setNewChatType] = useState("group");
  const [newChatDescription, setNewChatDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    getCurrentUser();
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      subscribeToMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Get profile data to ensure we have the correct user_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("user_id", user.id)
        .single();
      
      setUser({ ...user, profile_id: profile?.id });
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, department, position");

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить пользователей", variant: "destructive" });
      return;
    }

    setProfiles(data || []);
  };

  const fetchChats = async () => {
    setLoading(true);
    
    try {
      // Сначала получаем чаты, где пользователь является участником
      const { data: userMemberships, error: memberError } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", user?.id);

      if (memberError) {
        console.error("Member error:", memberError);
        toast({ title: "Ошибка", description: "Не удалось загрузить участников чатов", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (!userMemberships || userMemberships.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      const chatIds = userMemberships.map(m => m.chat_id);

      // Теперь получаем сами чаты
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("*")
        .in("id", chatIds)
        .order("updated_at", { ascending: false });

      if (chatsError) {
        console.error("Chats error:", chatsError);
        toast({ title: "Ошибка", description: "Не удалось загрузить чаты", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Fetch last message for each chat
      const chatsWithLastMessage = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select(`
              content,
              created_at,
              sender_id
            `)
            .eq("chat_id", chat.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          let senderName = "Неизвестный";
          if (lastMessage) {
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", lastMessage.sender_id)
              .single();
            
            senderName = senderProfile?.full_name || "Неизвестный";
          }

          return {
            ...chat,
            last_message: lastMessage ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              sender: { full_name: senderName }
            } : null
          };
        })
      );

      setChats(chatsWithLastMessage);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({ title: "Ошибка", description: "Произошла неожиданная ошибка при загрузке чатов", variant: "destructive" });
    }
    
    setLoading(false);
  };

  const fetchMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить сообщения", variant: "destructive" });
      return;
    }

    // Fetch sender profiles for each message
    const messagesWithSenders = await Promise.all(
      (data || []).map(async (message) => {
        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", message.sender_id)
          .single();

        return {
          ...message,
          sender: { full_name: senderProfile?.full_name || "Неизвестный" }
        };
      })
    );

    setMessages(messagesWithSenders);
  };

  const subscribeToMessages = (chatId: string) => {
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          const { data: messageData } = await supabase
            .from("messages")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (messageData) {
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", messageData.sender_id)
              .single();

            const newMessage = {
              ...messageData,
              sender: { full_name: senderProfile?.full_name || "Неизвестный" }
            };

            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createChat = async () => {
    if (!newChatName.trim() || selectedMembers.length === 0) {
      toast({ title: "Ошибка", description: "Заполните все обязательные поля", variant: "destructive" });
      return;
    }

    try {
      console.log("Creating chat with data:", {
        name: newChatName,
        type: newChatType,
        description: newChatDescription,
        created_by: user?.id,
        selectedMembers
      });

      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .insert({
          name: newChatName,
          type: newChatType,
          description: newChatDescription,
          created_by: user?.id // Используем user.id который является auth.uid()
        })
        .select()
        .single();

      if (chatError) {
        console.error("Chat creation error:", chatError);
        toast({ title: "Ошибка", description: `Не удалось создать чат: ${chatError.message}`, variant: "destructive" });
        return;
      }

      console.log("Chat created successfully:", chat);

      // Add creator as admin
      const { error: creatorError } = await supabase
        .from("chat_members")
        .insert({
          chat_id: chat.id,
          user_id: user?.id,
          role: "admin"
        });

      if (creatorError) {
        console.error("Creator member error:", creatorError);
        toast({ title: "Ошибка", description: `Не удалось добавить создателя: ${creatorError.message}`, variant: "destructive" });
        return;
      }

      // Add selected members - использовать user_id вместо id
      if (selectedMembers.length > 0) {
        const memberInserts = selectedMembers.map(profileId => {
          const profile = profiles.find(p => p.id === profileId);
          return {
            chat_id: chat.id,
            user_id: profile?.user_id, // Использовать user_id из профиля
            role: "member"
          };
        });

        const { error: membersError } = await supabase
          .from("chat_members")
          .insert(memberInserts);

        if (membersError) {
          console.error("Members error:", membersError);
          toast({ title: "Ошибка", description: `Не удалось добавить участников: ${membersError.message}`, variant: "destructive" });
          return;
        }
      }

      setIsCreatingChat(false);
      setNewChatName("");
      setNewChatType("group");
      setNewChatDescription("");
      setSelectedMembers([]);
      fetchChats();

      toast({ title: "Успех", description: "Чат создан" });
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({ title: "Ошибка", description: "Произошла неожиданная ошибка", variant: "destructive" });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const { error } = await supabase
      .from("messages")
      .insert({
        chat_id: selectedChat.id,
        sender_id: user.id,
        content: newMessage,
        message_type: "text"
      });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось отправить сообщение", variant: "destructive" });
      return;
    }

    setNewMessage("");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("message-files")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Ошибка", description: "Не удалось загрузить файл", variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage
      .from("message-files")
      .getPublicUrl(filePath);

    await supabase
      .from("messages")
      .insert({
        chat_id: selectedChat.id,
        sender_id: user.id,
        content: `Файл: ${file.name}`,
        message_type: file.type.startsWith('image/') ? 'image' : 'file',
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size
      });
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChatTypeDisplay = (type: string) => {
    switch (type) {
      case "group": return "Группа";
      case "direct": return "Личный";
      case "broadcast": return "Рассылка";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Загрузка мессенджера...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden">
      {/* Sidebar with chats */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Чаты</h2>
            <Dialog open={isCreatingChat} onOpenChange={setIsCreatingChat}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новый чат</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Название</label>
                    <Input
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                      placeholder="Название чата"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Тип</label>
                    <Select value={newChatType} onValueChange={setNewChatType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group">Группа</SelectItem>
                        <SelectItem value="direct">Личный чат</SelectItem>
                        <SelectItem value="broadcast">Рассылка</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Описание</label>
                    <Textarea
                      value={newChatDescription}
                      onChange={(e) => setNewChatDescription(e.target.value)}
                      placeholder="Описание чата (необязательно)"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Участники</label>
                    <Select 
                      value="" 
                      onValueChange={(value) => {
                        if (value && !selectedMembers.includes(value)) {
                          setSelectedMembers([...selectedMembers, value]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Добавить участника" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles
                          .filter(p => p.id !== user?.profile_id && !selectedMembers.includes(p.id))
                          .map(profile => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name} - {profile.position}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedMembers.map(memberId => {
                        const profile = profiles.find(p => p.id === memberId);
                        return (
                          <Badge key={memberId} variant="secondary">
                            {profile?.full_name}
                            <button
                              onClick={() => setSelectedMembers(selectedMembers.filter(id => id !== memberId))}
                              className="ml-2 text-xs"
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <Button onClick={createChat} className="w-full">
                    Создать чат
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск чатов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredChats.map(chat => (
              <Card
                key={chat.id}
                className={`cursor-pointer transition-colors ${
                  selectedChat?.id === chat.id ? "bg-accent" : "hover:bg-accent/50"
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {chat.type === "group" ? <Users className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{chat.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {getChatTypeDisplay(chat.type)}
                        </Badge>
                      </div>
                      {chat.last_message && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground truncate">
                            {chat.last_message.sender.full_name}: {chat.last_message.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(chat.last_message.created_at), { 
                              addSuffix: true, 
                              locale: ru 
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {selectedChat.type === "group" ? <Users className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedChat.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getChatTypeDisplay(selectedChat.type)}
                    {selectedChat.description && ` • ${selectedChat.description}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      message.sender_id === user?.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    }`}>
                      {message.sender_id !== user?.id && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {message.sender.full_name}
                        </p>
                      )}
                      
                      {message.message_type === "text" && (
                        <p className="text-sm">{message.content}</p>
                      )}
                      
                      {message.message_type === "file" && (
                        <div className="text-sm">
                          <Paperclip className="h-4 w-4 inline mr-1" />
                          <a 
                            href={message.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {message.file_name}
                          </a>
                        </div>
                      )}
                      
                      {message.message_type === "image" && (
                        <div>
                          <img 
                            src={message.file_url} 
                            alt={message.file_name}
                            className="rounded max-w-full h-auto"
                          />
                        </div>
                      )}
                      
                      <p className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(new Date(message.created_at), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 border-t bg-card">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Написать сообщение..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Выберите чат</h3>
              <p className="text-muted-foreground">Выберите чат из списка, чтобы начать общение</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}