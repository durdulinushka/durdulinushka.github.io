import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AddEmployeeDialog } from "./AddEmployeeDialog";

interface EmployeeListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onEmployeeAdded: () => void;
}

export const EmployeeListHeader = ({ 
  searchQuery, 
  onSearchChange, 
  onEmployeeAdded 
}: EmployeeListHeaderProps) => {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Управление сотрудниками</CardTitle>
        <CardDescription>
          Просмотр и управление сотрудниками компании
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Input
            placeholder="Поиск сотрудников..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1"
          />
          <AddEmployeeDialog onEmployeeAdded={onEmployeeAdded} />
        </div>
      </CardContent>
    </Card>
  );
};