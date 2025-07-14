import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ManageAdminRoleDialogProps {
  employeeId: string;
  employeeName: string;
  currentRole: string;
  onRoleUpdated: () => void;
}

export function ManageAdminRoleDialog({ 
  employeeId, 
  employeeName, 
  currentRole,
  onRoleUpdated 
}: ManageAdminRoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const isAdmin = currentRole === 'admin';

  const handleRoleChange = async () => {
    setLoading(true);
    
    try {
      const newRole = isAdmin ? 'employee' : 'admin';
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Права ${isAdmin ? 'отозваны у' : 'предоставлены'} ${employeeName}`,
      });
      
      setOpen(false);
      onRoleUpdated();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить права",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Права
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Управление правами</DialogTitle>
          <DialogDescription>
            Изменить права доступа для сотрудника {employeeName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                {isAdmin ? (
                  <Shield className="w-5 h-5 text-orange-500" />
                ) : (
                  <ShieldOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{employeeName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">Текущая роль:</span>
                  <Badge variant={isAdmin ? "default" : "secondary"}>
                    {isAdmin ? "Администратор" : "Сотрудник"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {isAdmin ? (
                "Отозвать права администратора? Сотрудник потеряет доступ к панели администратора."
              ) : (
                "Предоставить права администратора? Сотрудник получит полный доступ к панели администратора."
              )}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleRoleChange}
            disabled={loading}
            variant={isAdmin ? "destructive" : "default"}
          >
            {loading ? "Изменение..." : (isAdmin ? "Отозвать права" : "Предоставить права")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}