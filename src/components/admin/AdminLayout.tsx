import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminLayoutProps {
  children: ReactNode;
  mobileNav?: ReactNode;
}

const AdminLayout = ({ children, mobileNav }: AdminLayoutProps) => {
  const { isAdmin, loading, logout } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // O hook já redireciona, então não renderizamos nada.
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {mobileNav}
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Painel Admin
          </h1>
        </div>
        <Button variant="outline" onClick={logout} size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </header>
      <main className="p-4 max-w-7xl mx-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;