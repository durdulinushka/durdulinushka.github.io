import { Card, CardContent } from "@/components/ui/card";

export const EmptyEmployeeState = () => {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-8 text-center">
        <p className="text-muted-foreground">
          Сотрудники не найдены
        </p>
      </CardContent>
    </Card>
  );
};