import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageCircle, FileText } from "lucide-react";
import { DeleteTaskDialog } from "./DeleteTaskDialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  task_type: string;
  due_date: string | null;
  status: string;
  assignee_id: string;
  department: string;
}

interface TaskActionsProps {
  currentTask: Task;
  onAddComment: (content: string) => Promise<void>;
  onUploadDocument: (file: File) => Promise<void>;
  onTaskDeleted?: () => void;
  isAdmin?: boolean;
}

const TaskActions = ({ currentTask, onAddComment, onUploadDocument, onTaskDeleted, isAdmin }: TaskActionsProps) => {
  const [commentContent, setCommentContent] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;
    await onAddComment(commentContent.trim());
    setCommentContent("");
  };

  const handleUploadDocument = async () => {
    if (!documentFile) return;
    await onUploadDocument(documentFile);
    setDocumentFile(null);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Добавить комментарий
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить комментарий</DialogTitle>
            <DialogDescription>
              Комментарий к задаче "{currentTask.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Введите комментарий..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={handleAddComment}>
                Добавить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Приложить документ
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Приложить документ</DialogTitle>
            <DialogDescription>
              Документ к задаче "{currentTask.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
            />
            {documentFile && (
              <p className="text-sm text-muted-foreground">
                Выбран файл: {documentFile.name}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={handleUploadDocument} disabled={!documentFile}>
                Загрузить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isAdmin && (
        <DeleteTaskDialog
          taskId={currentTask.id}
          taskTitle={currentTask.title}
          onTaskDeleted={onTaskDeleted}
        />
      )}
    </div>
  );
};

export default TaskActions;