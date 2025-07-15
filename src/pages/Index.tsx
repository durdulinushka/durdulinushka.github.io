import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User } from "lucide-react";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Index = () => {
  const [userRole, setUserRole] = useState<'employee' | 'admin' | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedEmployeeId, setImpersonatedEmployeeId] = useState<string | null>(null);
  const [impersonatedEmployeeName, setImpersonatedEmployeeName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session and set up auth listener
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Получаем роль пользователя из базы данных
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        setUserRole((profile?.role as 'employee' | 'admin') || 'employee');
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Получаем роль пользователя из базы данных
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();
            
            setUserRole((profile?.role as 'employee' | 'admin') || 'employee');
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // If not authenticated, redirect to auth page
  if (!loading && !user) {
    navigate('/auth');
    return null;
  }

  if (loading || userRole === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если администратор вошёл как сотрудник, показываем панель сотрудника
  if (userRole === 'admin' && impersonatedEmployeeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        {/* Индикатор режима администратора */}
        <div className="bg-corporate-orange text-white p-2 text-center">
          <span className="text-sm">
            Режим администратора - Вы просматриваете систему как: {impersonatedEmployeeName}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-4 text-white hover:bg-white/20"
            onClick={() => {
              setImpersonatedEmployeeId(null);
              setImpersonatedEmployeeName("");
            }}
          >
            Вернуться к панели администратора
          </Button>
        </div>
        <EmployeeDashboard 
          employeeId={impersonatedEmployeeId}
          onBack={async () => {
            await supabase.auth.signOut();
            navigate('/auth');
          }} 
        />
      </div>
    );
  }

  if (userRole === 'employee') {
    return <EmployeeDashboard onBack={async () => {
      await supabase.auth.signOut();
      navigate('/auth');
    }} />;
  }

  if (userRole === 'admin') {
    return <AdminDashboard 
      onBack={async () => {
        await supabase.auth.signOut();
        navigate('/auth');
      }}
      onImpersonate={(employeeId, employeeName) => {
        setImpersonatedEmployeeId(employeeId);
        setImpersonatedEmployeeName(employeeName);
      }}
    />;
  }

  // Этот код не должен выполняться, но на всякий случай
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Ошибка: неопределенная роль пользователя</p>
        <Button 
          variant="outline" 
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/auth');
          }}
          className="mt-4"
        >
          Выйти из системы
        </Button>
      </div>
    </div>
  );
};

export default Index;