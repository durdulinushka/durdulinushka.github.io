import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  department: string;
  position: string;
  daily_hours: number;
  email: string;
}

interface EmployeePlanDialogProps {
  employee: Employee;
  onPlanUpdated?: () => void;
}

export const EmployeePlanDialog = ({ employee, onPlanUpdated }: EmployeePlanDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    daily_hours: employee.daily_hours || 8,
    department: employee.department,
    position: employee.position,
  });
  const { toast } = useToast();

  const departments = [
    'IT',
    'Маркетинг',
    'Продажи',
    'HR',
    'Финансы',
    'Производство',
    'Логистика'
  ];

  const positions = [
    'Разработчик',
    'Тестировщик',
    'Менеджер проектов',
    'Дизайнер',
    'Аналитик',
    'Специалист',
    'Руководитель',
    'Директор'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          daily_hours: formData.daily_hours,
          department: formData.department,
          position: formData.position,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employee.id);

      if (error) {
        throw error;
      }

      toast({
        title: "План обновлен",
        description: `План для ${employee.full_name} успешно обновлен`,
      });

      setOpen(false);
      onPlanUpdated?.();
    } catch (error) {
      console.error('Error updating employee plan:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить план сотрудника",
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
          <Settings className="w-4 h-4 mr-1" />
          Настроить план
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Настройка плана сотрудника</DialogTitle>
          <DialogDescription>
            Настройте рабочий план для <strong>{employee.full_name}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="daily_hours" className="text-right">
                Часы в день
              </Label>
              <Input
                id="daily_hours"
                type="number"
                min="1"
                max="24"
                value={formData.daily_hours}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  daily_hours: parseInt(e.target.value) || 8 
                }))}
                className="col-span-3"
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Департамент
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  department: value 
                }))}
                disabled={loading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Выберите департамент" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Позиция
              </Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  position: value 
                }))}
                disabled={loading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Выберите позицию" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};