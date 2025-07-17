import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Eye } from "lucide-react";
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
  created_at: string;
  uploader_name?: string;
}

interface ProjectMaterialsProps {
  projectId: string;
  projectName: string;
}

export const ProjectMaterials = ({ projectId, projectName }: ProjectMaterialsProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchProjectMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          uploader:profiles!materials_uploader_id_fkey(full_name)
        `)
        .eq('project_id', projectId)
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
        created_at: material.created_at,
        uploader_name: material.uploader?.full_name || 'Неизвестен'
      })) || [];

      setMaterials(formattedMaterials);
    } catch (error) {
      console.error('Error fetching project materials:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить материалы проекта",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjectMaterials();
    }
  }, [isOpen, projectId]);

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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Неизвестно';
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Материалы
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Материалы проекта "{projectName}"
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>В этом проекте пока нет материалов</p>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((material) => (
              <Card key={material.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-sm">{material.title}</h4>
                      {material.description && (
                        <p className="text-xs text-muted-foreground">{material.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Размер: {formatFileSize(material.file_size)}</span>
                        <span>Загрузил: {material.uploader_name}</span>
                        <span>Дата: {format(new Date(material.created_at), 'dd.MM.yyyy', { locale: ru })}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(material)}
                      className="ml-4"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};