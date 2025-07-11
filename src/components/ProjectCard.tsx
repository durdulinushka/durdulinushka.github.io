import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Settings, Plus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Project } from "./ProjectManagement";
import { ProjectMembersDialog } from "./ProjectMembersDialog";
import { ProjectTasksDialog } from "./ProjectTasksDialog";

interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  onUpdate: () => void;
}

export const ProjectCard = ({ project, isAdmin, onUpdate }: ProjectCardProps) => {
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showTasksDialog, setShowTasksDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активный';
      case 'completed':
        return 'Завершен';
      case 'on_hold':
        return 'Приостановлен';
      default:
        return status;
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <Badge className={getStatusColor(project.status)}>
              {getStatusText(project.status)}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Отдел: {project.department}</span>
          </div>

          {(project.start_date || project.end_date) && (
            <div className="text-sm text-muted-foreground">
              {project.start_date && (
                <div>
                  Начало: {format(new Date(project.start_date), 'd MMMM yyyy', { locale: ru })}
                </div>
              )}
              {project.end_date && (
                <div>
                  Окончание: {format(new Date(project.end_date), 'd MMMM yyyy', { locale: ru })}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMembersDialog(true)}
              className="flex items-center gap-1"
            >
              <Users className="w-4 h-4" />
              Участники
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTasksDialog(true)}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Задачи
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProjectMembersDialog
        project={project}
        open={showMembersDialog}
        onOpenChange={setShowMembersDialog}
        isAdmin={isAdmin}
        onUpdate={onUpdate}
      />

      <ProjectTasksDialog
        project={project}
        open={showTasksDialog}
        onOpenChange={setShowTasksDialog}
        isAdmin={isAdmin}
        onUpdate={onUpdate}
      />
    </>
  );
};