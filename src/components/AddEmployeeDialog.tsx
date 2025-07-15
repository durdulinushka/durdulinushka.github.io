import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface AddEmployeeDialogProps {
  onEmployeeAdded?: () => void;
}

interface Department {
  id: string;
  name: string;
}

export const AddEmployeeDialog = ({ onEmployeeAdded }: AddEmployeeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    position: '',
    department: '',
    daily_hours: 8,
    avatar_url: ''
  });

  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось загрузить список отделов", 
        variant: "destructive" 
      });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          full_name: formData.full_name,
          email: formData.email,
          position: formData.position,
          department: formData.department,
          daily_hours: formData.daily_hours,
          avatar_url: formData.avatar_url || null
        }]);

      if (error) {
        throw error;
      }

      toast({
        title: "Сотрудник добавлен",
        description: `${formData.full_name} успешно добавлен в систему`,
      });

      // Сброс формы
      setFormData({
        full_name: '',
        email: '',
        position: '',
        department: '',
        daily_hours: 8,
        avatar_url: ''
      });

      setOpen(false);
      onEmployeeAdded?.();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить сотрудника",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="corporate" className="gap-2">
          <Plus className="w-4 h-4" />
          Добавить сотрудника
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить нового сотрудника</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Полное имя *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Иван Иванов"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="ivan@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Должность *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              placeholder="Разработчик"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Отдел *</Label>
            <Select 
              value={formData.department} 
              onValueChange={(value) => handleInputChange('department', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите отдел" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily_hours">Рабочих часов в день</Label>
            <Input
              id="daily_hours"
              type="number"
              min="1"
              max="24"
              value={formData.daily_hours}
              onChange={(e) => handleInputChange('daily_hours', parseInt(e.target.value) || 8)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_url">URL аватара (необязательно)</Label>
            <Input
              id="avatar_url"
              value={formData.avatar_url}
              onChange={(e) => handleInputChange('avatar_url', e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              variant="corporate"
              disabled={loading}
            >
              {loading ? 'Добавление...' : 'Добавить сотрудника'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};