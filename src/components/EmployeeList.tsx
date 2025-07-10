import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmployeeListHeader } from "./EmployeeListHeader";
import { EmployeeCard } from "./EmployeeCard";
import { EmptyEmployeeState } from "./EmptyEmployeeState";

interface Employee {
  id: string;
  full_name: string;
  department: string;
  position: string;
  daily_hours: number;
  email: string;
}

const EmployeeList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        throw error;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список сотрудников",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEmployeeAdded = () => {
    fetchEmployees();
  };

  const handleEmployeeDeleted = () => {
    fetchEmployees();
  };

  const handlePlanUpdated = () => {
    fetchEmployees();
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmployeeListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEmployeeAdded={handleEmployeeAdded}
      />

      {/* Список сотрудников */}
      <div className="grid gap-4">
        {filteredEmployees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onEmployeeDeleted={handleEmployeeDeleted}
            onPlanUpdated={handlePlanUpdated}
          />
        ))}
      </div>

      {filteredEmployees.length === 0 && !loading && <EmptyEmployeeState />}
    </div>
  );
};

export default EmployeeList;