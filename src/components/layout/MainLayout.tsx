import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import BottomNav from "./BottomNav";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

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