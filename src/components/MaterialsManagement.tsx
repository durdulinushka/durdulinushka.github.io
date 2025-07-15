import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Upload, Download, Eye, Trash2, Edit2, File, Users, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploader_id: string;
  access_type: 'public' | 'department' | 'selected_users';
  department: string | null;
  allowed_users: string[];
  created_at: string;
  uploader_name?: string;
}

interface Profile {
  id: string;
  full_name: string;
  department: string;
  position: string;
}

const MaterialsManagement = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    access_type: "public" as 'public' | 'department' | 'selected_users',
    department: "",
    allowed_users: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterials();
    fetchProfiles();
    fetchDepartments();
  }, []);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          uploader:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMaterials: Material[] = data?.map(material => ({
        id: material.id,
        title: material.title,
        description: material.description,
        file_name: material.file_name,
        file_path: material.file_path,
        file_size: material.file_size,
        file_type: material.file_type,
        uploader_id: material.uploader_id,
        access_type: material.access_type as 'public' | 'department' | 'selected_users',
        department: material.department,
        allowed_users: Array.isArray(material.allowed_users) ? material.allowed_users.map(id => String(id)) : [],
        created_at: material.created_at,
        uploader_name: Array.isArray(material.uploader) && material.uploader[0]?.full_name || 'Неизвестен'
      })) || [];

      setMaterials(formattedMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить материалы", variant: "destructive" });
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

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .order('name');

      if (error) throw error;
      const departmentNames = data?.map(d => d.name) || [];
      setDepartments(departmentNames);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadMaterial = async () => {
    if (!selectedFile || !newMaterial.title) {
      toast({ title: "Ошибка", description: "Выберите файл и введите название", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Пользователь не авторизован');

      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${userData.user.id}/${Date.now()}.${fileExtension}`;

      // Загружаем файл в storage
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Создаем запись в таблице materials
      const { error: insertError } = await supabase
        .from('materials')
        .insert([{
          title: newMaterial.title,
          description: newMaterial.description,
          file_name: selectedFile.name,
          file_path: fileName,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          uploader_id: userData.user.id,
          access_type: newMaterial.access_type,
          department: newMaterial.access_type === 'department' ? newMaterial.department : null,
          allowed_users: newMaterial.access_type === 'selected_users' ? newMaterial.allowed_users : []
        }]);

      if (insertError) throw insertError;

      toast({ title: "Успех", description: "Материал успешно загружен" });
      setShowUploadDialog(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error('Error uploading material:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить материал", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const updateMaterial = async () => {
    if (!editingMaterial) return;

    try {
      const { error } = await supabase
        .from('materials')
        .update({
          title: newMaterial.title,
          description: newMaterial.description,
          access_type: newMaterial.access_type,
          department: newMaterial.access_type === 'department' ? newMaterial.department : null,
          allowed_users: newMaterial.access_type === 'selected_users' ? newMaterial.allowed_users : []
        })
        .eq('id', editingMaterial.id);

      if (error) throw error;

      toast({ title: "Успех", description: "Материал успешно обновлен" });
      setShowEditDialog(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error('Error updating material:', error);
      toast({ title: "Ошибка", description: "Не удалось обновить материал", variant: "destructive" });
    }
  };

  const deleteMaterial = async (material: Material) => {
    try {
      // Удаляем файл из storage
      const { error: storageError } = await supabase.storage
        .from('materials')
        .remove([material.file_path]);

      if (storageError) console.error('Storage delete error:', storageError);

      // Удаляем запись из таблицы
      const { error: dbError } = await supabase
        .from('materials')
        .delete()
        .eq('id', material.id);

      if (dbError) throw dbError;

      toast({ title: "Успех", description: "Материал удален" });
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({ title: "Ошибка", description: "Не удалось удалить материал", variant: "destructive" });
    }
  };

  const downloadFile = async (material: Material) => {
    try {
      const { data, error } = await supabase.storage
        .from('materials')
        .download(material.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: "Ошибка", description: "Не удалось скачать файл", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setNewMaterial({
      title: "",
      description: "",
      access_type: "public",
      department: "",
      allowed_users: []
    });
    setSelectedFile(null);
    setEditingMaterial(null);
  };

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material);
    setNewMaterial({
      title: material.title,
      description: material.description || "",
      access_type: material.access_type,
      department: material.department || "",
      allowed_users: material.allowed_users
    });
    setShowEditDialog(true);
  };

  const getAccessIcon = (accessType: string) => {
    switch (accessType) {
      case 'public':
        return <Eye className="w-4 h-4" />;
      case 'department':
        return <Building className="w-4 h-4" />;
      case 'selected_users':
        return <Users className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getAccessLabel = (material: Material) => {
    switch (material.access_type) {
      case 'public':
        return 'Всем';
      case 'department':
        return `Отдел: ${material.department}`;
      case 'selected_users':
        return `Пользователи: ${material.allowed_users.length}`;
      default:
        return 'Неизвестно';
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Неизвестно';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (material.uploader_name && material.uploader_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDepartment = filterDepartment === "all" || 
                             (material.access_type === 'department' && material.department === filterDepartment);
    
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление материалами</CardTitle>
              <CardDescription>
                Загрузка и управление доступом к файлам и документам
              </CardDescription>
            </div>
            <Button variant="corporate" onClick={() => setShowUploadDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Загрузить материал
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Поиск материалов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Фильтр по отделу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все отделы</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Список материалов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((material) => (
          <Card key={material.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <File className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-sm truncate">{material.title}</h3>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadFile(material)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(material)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMaterial(material)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {material.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {material.description}
                </p>
              )}
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Файл:</span>
                  <span className="truncate ml-2">{material.file_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Размер:</span>
                  <span>{formatFileSize(material.file_size)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Загрузил:</span>
                  <span className="truncate ml-2">{material.uploader_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Дата:</span>
                  <span>{format(new Date(material.created_at), 'dd.MM.yyyy', { locale: ru })}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  {getAccessIcon(material.access_type)}
                  <Badge variant="outline" className="text-xs">
                    {getAccessLabel(material)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <File className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Материалы не найдены</h3>
            <p className="text-muted-foreground">
              Загрузите первый материал или измените параметры поиска
            </p>
          </CardContent>
        </Card>
      )}

      {/* Диалог загрузки */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Загрузить материал</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Файл</label>
              <Input type="file" onChange={handleFileSelect} />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Выбран: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            
            <Input
              placeholder="Название материала"
              value={newMaterial.title}
              onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
            />
            
            <Textarea
              placeholder="Описание (необязательно)"
              value={newMaterial.description}
              onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
            />
            
            <div>
              <label className="block text-sm font-medium mb-2">Доступ</label>
              <Select 
                value={newMaterial.access_type} 
                onValueChange={(value: 'public' | 'department' | 'selected_users') => 
                  setNewMaterial({...newMaterial, access_type: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Всем пользователям</SelectItem>
                  <SelectItem value="department">Только отделу</SelectItem>
                  <SelectItem value="selected_users">Выбранным пользователям</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newMaterial.access_type === 'department' && (
              <Select 
                value={newMaterial.department} 
                onValueChange={(value) => setNewMaterial({...newMaterial, department: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите отдел" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {newMaterial.access_type === 'selected_users' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Выберите пользователей</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={newMaterial.allowed_users.includes(profile.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewMaterial({
                              ...newMaterial,
                              allowed_users: [...newMaterial.allowed_users, profile.id]
                            });
                          } else {
                            setNewMaterial({
                              ...newMaterial,
                              allowed_users: newMaterial.allowed_users.filter(id => id !== profile.id)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{profile.full_name} - {profile.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="corporate" 
                onClick={uploadMaterial} 
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Загрузить
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowUploadDialog(false);
                resetForm();
              }}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать материал</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Название материала"
              value={newMaterial.title}
              onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
            />
            
            <Textarea
              placeholder="Описание (необязательно)"
              value={newMaterial.description}
              onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
            />
            
            <div>
              <label className="block text-sm font-medium mb-2">Доступ</label>
              <Select 
                value={newMaterial.access_type} 
                onValueChange={(value: 'public' | 'department' | 'selected_users') => 
                  setNewMaterial({...newMaterial, access_type: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Всем пользователям</SelectItem>
                  <SelectItem value="department">Только отделу</SelectItem>
                  <SelectItem value="selected_users">Выбранным пользователям</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newMaterial.access_type === 'department' && (
              <Select 
                value={newMaterial.department} 
                onValueChange={(value) => setNewMaterial({...newMaterial, department: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите отдел" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {newMaterial.access_type === 'selected_users' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Выберите пользователей</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={newMaterial.allowed_users.includes(profile.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewMaterial({
                              ...newMaterial,
                              allowed_users: [...newMaterial.allowed_users, profile.id]
                            });
                          } else {
                            setNewMaterial({
                              ...newMaterial,
                              allowed_users: newMaterial.allowed_users.filter(id => id !== profile.id)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{profile.full_name} - {profile.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button variant="corporate" onClick={updateMaterial}>
                <Edit2 className="w-4 h-4 mr-2" />
                Сохранить
              </Button>
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                resetForm();
              }}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialsManagement;