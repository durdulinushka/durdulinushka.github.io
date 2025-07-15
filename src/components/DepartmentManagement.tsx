import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Edit, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
  description: string | null;
  head_id: string | null;
  head_name: string | null;
  employee_count: number;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  department: string;
  position: string;
}

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
    head_id: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
    fetchProfiles();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          head:profiles!departments_head_id_fkey(full_name)
        `)
        .order('name');

      if (error) throw error;

      // Получаем количество сотрудников для каждого отдела
      const { data: employeeCounts, error: countError } = await supabase
        .from('profiles')
        .select('department')
        .neq('department', '');

      if (countError) throw countError;

      const departmentCounts = employeeCounts?.reduce((acc, profile) => {
        acc[profile.department] = (acc[profile.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const formattedDepartments: Department[] = data?.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        head_id: dept.head_id,
        head_name: dept.head?.full_name || null,
        employee_count: departmentCounts[dept.name] || 0,
        created_at: dept.created_at
      })) || [];

      setDepartments(formattedDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить отделы", variant: "destructive" });
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const createDepartment = async () => {
    if (!newDepartment.name.trim()) {
      toast({ title: "Ошибка", description: "Название отдела обязательно", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .insert([{
          name: newDepartment.name.trim(),
          description: newDepartment.description.trim() || null,
          head_id: newDepartment.head_id || null
        }]);

      if (error) throw error;

      toast({ title: "Успех", description: "Отдел создан успешно" });
      setShowCreateForm(false);
      setNewDepartment({ name: "", description: "", head_id: "" });
      fetchDepartments();
    } catch (error: any) {
      console.error('Error creating department:', error);
      if (error.code === '23505') {
        toast({ title: "Ошибка", description: "Отдел с таким названием уже существует", variant: "destructive" });
      } else {
        toast({ title: "Ошибка", description: "Не удалось создать отдел", variant: "destructive" });
      }
    }
  };

  const updateDepartment = async () => {
    if (!editingDepartment || !editingDepartment.name.trim()) {
      toast({ title: "Ошибка", description: "Название отдела обязательно", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: editingDepartment.name.trim(),
          description: editingDepartment.description?.trim() || null,
          head_id: editingDepartment.head_id || null
        })
        .eq('id', editingDepartment.id);

      if (error) throw error;

      toast({ title: "Успех", description: "Отдел обновлен успешно" });
      setEditingDepartment(null);
      fetchDepartments();
    } catch (error: any) {
      console.error('Error updating department:', error);
      if (error.code === '23505') {
        toast({ title: "Ошибка", description: "Отдел с таким названием уже существует", variant: "destructive" });
      } else {
        toast({ title: "Ошибка", description: "Не удалось обновить отдел", variant: "destructive" });
      }
    }
  };

  const deleteDepartment = async (departmentId: string, departmentName: string) => {
    if (departmentName === 'Не указан') {
      toast({ title: "Ошибка", description: "Нельзя удалить отдел по умолчанию", variant: "destructive" });
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить отдел "${departmentName}"?`)) {
      return;
    }

    try {
      // Сначала проверим, есть ли сотрудники в этом отделе
      const { data: employees, error: employeeError } = await supabase
        .from('profiles')
        .select('id')
        .eq('department', departmentName);

      if (employeeError) throw employeeError;

      if (employees && employees.length > 0) {
        // Переместим всех сотрудников в отдел "Не указан"
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ department: 'Не указан' })
          .eq('department', departmentName);

        if (updateError) throw updateError;
      }

      // Теперь удаляем отдел
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);

      if (error) throw error;

      toast({ 
        title: "Успех", 
        description: employees && employees.length > 0 
          ? `Отдел удален, ${employees.length} сотрудник(ов) перемещено в "Не указан"`
          : "Отдел удален успешно"
      });
      
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({ title: "Ошибка", description: "Не удалось удалить отдел", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Управление отделами
              </CardTitle>
              <CardDescription>
                Создание и редактирование отделов компании
              </CardDescription>
            </div>
            <Button 
              variant="corporate" 
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать отдел
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Руководитель</TableHead>
                <TableHead>Сотрудники</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.description || 'Нет описания'}</TableCell>
                  <TableCell>{department.head_name || 'Не назначен'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Users className="w-3 h-3" />
                      {department.employee_count}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingDepartment(department)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {department.name !== 'Не указан' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteDepartment(department.id, department.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {departments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Отделы не найдены
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог создания отдела */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый отдел</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Название отдела" 
              value={newDepartment.name}
              onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
            />
            <Textarea 
              placeholder="Описание отдела" 
              value={newDepartment.description}
              onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
            />
            <Select value={newDepartment.head_id || 'none'} onValueChange={(value) => setNewDepartment({...newDepartment, head_id: value === 'none' ? '' : value})}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите руководителя (необязательно)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не назначен</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name} - {profile.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="corporate" onClick={createDepartment}>
                Создать
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования отдела */}
      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать отдел</DialogTitle>
          </DialogHeader>
          {editingDepartment && (
            <div className="space-y-4">
              <Input 
                placeholder="Название отдела" 
                value={editingDepartment.name}
                onChange={(e) => setEditingDepartment({...editingDepartment, name: e.target.value})}
              />
              <Textarea 
                placeholder="Описание отдела" 
                value={editingDepartment.description || ''}
                onChange={(e) => setEditingDepartment({...editingDepartment, description: e.target.value})}
              />
              <Select 
                value={editingDepartment.head_id || 'none'} 
                onValueChange={(value) => setEditingDepartment({...editingDepartment, head_id: value === 'none' ? null : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите руководителя (необязательно)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не назначен</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name} - {profile.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="corporate" onClick={updateDepartment}>
                  Сохранить
                </Button>
                <Button variant="outline" onClick={() => setEditingDepartment(null)}>
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentManagement;