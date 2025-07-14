import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserMinus, Crown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Project } from "./ProjectManagement";

interface ProjectMember {
  id: string;
  project_id: string;
  employee_id: string;
  role: string;
  added_at: string;
  profiles: {
    full_name: string;
    email: string;
    position: string;
    avatar_url?: string;
  };
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
  avatar_url?: string;
}

interface ProjectMembersDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onUpdate: () => void;
}

export const ProjectMembersDialog = ({ 
  project, 
  open, 
  onOpenChange, 
  isAdmin, 
  onUpdate 
}: ProjectMembersDialogProps) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          profiles:project_members_employee_id_fkey (
            full_name,
            email,
            position,
            avatar_url
          )
        `)
        .eq('project_id', project.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  const fetchAvailableEmployees = async () => {
    try {
      const { data: allEmployees, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      // Filter out employees who are already members
      const memberIds = members.map(m => m.employee_id);
      const available = (allEmployees || []).filter(emp => !memberIds.includes(emp.id));
      setAvailableEmployees(available);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, project.id]);

  useEffect(() => {
    if (members.length >= 0) {
      fetchAvailableEmployees();
    }
  }, [members]);

  const handleAddMember = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          employee_id: selectedEmployee,
          role: selectedRole,
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Участник добавлен в проект",
      });

      setSelectedEmployee("");
      setSelectedRole("member");
      fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить участника",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Участник удален из проекта",
      });

      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить участника",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Участники проекта: {project.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new member section */}
          {isAdmin && (
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Добавить участника</h4>
              {availableEmployees.length > 0 ? (
                <div className="flex gap-2">
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите сотрудника" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name} - {employee.position} ({employee.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Участник</SelectItem>
                      <SelectItem value="leader">Руководитель</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddMember}
                    disabled={!selectedEmployee || loading}
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Все сотрудники уже добавлены в проект
                </p>
              )}
            </div>
          )}

          {/* Members list */}
          <div className="space-y-4">
            <h4 className="font-medium">
              Участники ({members.length})
            </h4>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                В проекте пока нет участников
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.profiles.avatar_url} />
                      <AvatarFallback>
                        {member.profiles.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{member.profiles.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.profiles.position}
                      </div>
                    </div>
                    <Badge variant={member.role === 'leader' ? 'default' : 'secondary'}>
                      {member.role === 'leader' ? (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          Руководитель
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 mr-1" />
                          Участник
                        </>
                      )}
                    </Badge>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};