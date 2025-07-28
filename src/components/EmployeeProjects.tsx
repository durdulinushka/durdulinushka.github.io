import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, FolderOpen, MapPin, FileText, Download, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProjectMaterials } from "./ProjectMaterials";
import { ProjectManagement } from "./ProjectManagement";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  department: string;
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectMember {
  id: string;
  project_id: string;
  employee_id: string;
  role: string;
  added_at: string;
  project: Project;
}

interface EmployeeProjectsProps {
  employeeId: string;
}

export const EmployeeProjects = ({ employeeId }: EmployeeProjectsProps) => {
  const [projectMemberships, setProjectMemberships] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectManagement, setShowProjectManagement] = useState(false);
  const { toast } = useToast();

  const fetchEmployeeProjects = async () => {
    if (!employeeId) return;

    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('employee_id', employeeId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setProjectMemberships(data || []);
    } catch (error) {
      console.error('Error fetching employee projects:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить проекты",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeProjects();
  }, [employeeId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'on-hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активный';
      case 'completed': return 'Завершён';
      case 'on-hold': return 'Приостановлен';
      case 'cancelled': return 'Отменён';
      default: return 'Неизвестно';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'member': return 'Участник';
      case 'leader': return 'Руководитель';
      default: return 'Участник';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Мои проекты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Мои проекты
              </CardTitle>
              <CardDescription>
                Проекты, в которых вы участвуете
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowProjectManagement(!showProjectManagement)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showProjectManagement ? "Скрыть управление" : "Управлять проектами"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projectMemberships.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Вы пока не участвуете ни в одном проекте</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectMemberships.map((membership) => (
                <Card key={membership.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg leading-none">
                          {membership.project.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getRoleText(membership.role)}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs text-white ${getStatusColor(membership.project.status)}`}
                          >
                            {getStatusText(membership.project.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {membership.project.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {membership.project.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{membership.project.department}</span>
                      </div>
                      
                      {membership.project.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Начало: {format(new Date(membership.project.start_date), 'dd.MM.yyyy', { locale: ru })}
                          </span>
                        </div>
                      )}
                      
                      {membership.project.end_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Окончание: {format(new Date(membership.project.end_date), 'dd.MM.yyyy', { locale: ru })}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        <span>
                          Участвую с {format(new Date(membership.added_at), 'dd.MM.yyyy', { locale: ru })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <ProjectMaterials 
                        projectId={membership.project.id} 
                        projectName={membership.project.name} 
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Управление проектами */}
      {showProjectManagement && (
        <ProjectManagement isAdmin={false} />
      )}
    </div>
  );
};