import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import BottomNav from "./BottomNav";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        setUserRole(data?.role || null);
      }
    };

    checkUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();
          setUserRole(data?.role || null);
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNav />
      
      {userRole === "vendedor" && (
        <Button
          onClick={() => navigate("/painel-vendedor")}
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 shadow-lg z-50"
          size="icon"
        >
          <Store className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default MainLayout;
