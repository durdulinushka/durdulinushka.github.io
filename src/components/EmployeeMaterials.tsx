import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Upload, Download, Eye, File, Users, Building, Search } from "lucide-react";
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

interface EmployeeMaterialsProps {
  employeeId: string;
}

export const EmployeeMaterials = ({ employeeId }: EmployeeMaterialsProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
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
    fetchCurrentUserProfile();
    fetchMaterials();
    fetchProfiles();
    fetchDepartments();
  }, [employeeId]);

  const fetchCurrentUserProfile = async () => {
    if (!employeeId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
    }
  };

  const fetchMaterials = async () => {
    if (!employeeId) return;

    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          uploader:profiles!materials_uploader_id_fkey(full_name)
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
        uploader_name: material.uploader?.full_name || 'Неизвестен'
      })) || [];

      setMaterials(formattedMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({ 
        title: "Ошибка", 
        description: "Не удалось загрузить материалы", 
        variant: "destructive" 
      });
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, department, position')
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
      setDepartments(data?.map(d => d.name) || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !currentUserProfile) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentUserProfile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('materials')
        .insert({
          title: newMaterial.title,
          description: newMaterial.description || null,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          uploader_id: currentUserProfile.id,
          access_type: newMaterial.access_type,
          department: newMaterial.access_type === 'department' ? (newMaterial.department || currentUserProfile.department) : null,
          allowed_users: newMaterial.access_type === 'selected_users' ? newMaterial.allowed_users : []
        });

      if (insertError) throw insertError;

      toast({
        title: "Успешно",
        description: "Материал загружен",
      });

      setShowUploadDialog(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error('Error uploading material:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить материал",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (material: Material) => {
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
      console.error('Error downloading material:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось скачать файл",
        variant: "destructive",
      });
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
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Неизвестно';
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const getAccessTypeText = (type: string) => {
    switch (type) {
      case 'public': return 'Для всех';
      case 'department': return 'Для отдела';
      case 'selected_users': return 'Для выбранных';
      default: return 'Неизвестно';
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.uploader_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = filterDepartment === "all" || material.department === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5" />
              Материалы
            </CardTitle>
            <Button
              onClick={() => setShowUploadDialog(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить материал
            </Button>
          </div>
          <CardDescription>
            Просматривайте доступные материалы и загружайте новые
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Фильтры */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Поиск материалов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Фильтр по отделу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все отделы</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Список материалов */}
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Материалы не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-sm leading-none line-clamp-2">
                          {material.title}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {getAccessTypeText(material.access_type)}
                          </Badge>
                          {material.department && (
                            <Badge variant="secondary" className="text-xs">
                              {material.department}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {material.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {material.description}
                      </p>
                    )}
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Размер:</span>
                        <span>{formatFileSize(material.file_size)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Загрузил:</span>
                        <span>{material.uploader_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Дата:</span>
                        <span>{format(new Date(material.created_at), 'dd.MM.yyyy', { locale: ru })}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(material)}
                        className="flex-1 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Скачать
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог загрузки материала */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Загрузить материал</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Название</label>
              <Input
                value={newMaterial.title}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название материала"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Описание</label>
              <Textarea
                value={newMaterial.description}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Описание материала (необязательно)"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Файл</label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Доступ</label>
              <Select 
                value={newMaterial.access_type} 
                onValueChange={(value) => setNewMaterial(prev => ({ 
                  ...prev, 
                  access_type: value as 'public' | 'department' | 'selected_users' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Для всех</SelectItem>
                  <SelectItem value="department">Для отдела</SelectItem>
                  <SelectItem value="selected_users">Для выбранных пользователей</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newMaterial.access_type === 'department' && (
              <div>
                <label className="text-sm font-medium">Отдел</label>
                <Select 
                  value={newMaterial.department} 
                  onValueChange={(value) => setNewMaterial(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите отдел" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newMaterial.access_type === 'selected_users' && (
              <div>
                <label className="text-sm font-medium">Пользователи</label>
                <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                  {profiles.map(profile => (
                    <div key={profile.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={newMaterial.allowed_users.includes(profile.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewMaterial(prev => ({
                              ...prev,
                              allowed_users: [...prev.allowed_users, profile.id]
                            }));
                          } else {
                            setNewMaterial(prev => ({
                              ...prev,
                              allowed_users: prev.allowed_users.filter(id => id !== profile.id)
                            }));
                          }
                        }}
                      />
                      <span className="text-sm">{profile.full_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleFileUpload} 
                disabled={!newMaterial.title || !selectedFile || isUploading}
                className="flex-1"
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
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadDialog(false);
                  resetForm();
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};