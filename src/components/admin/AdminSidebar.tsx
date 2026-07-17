import { Package, Users, Settings, BarChart3, Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AdminSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { value: "ads", icon: Package, label: "Anúncios" },
  { value: "users", icon: Users, label: "Usuários" },
  { value: "notifications", icon: Bell, label: "Notificações" },
  { value: "metrics", icon: BarChart3, label: "Métricas" },
  { value: "settings", icon: Settings, label: "Configurações" },
];

const AdminSidebar = ({ currentTab, onTabChange }: AdminSidebarProps) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const renderNavItems = (closeSheet?: () => void) => (
    <div className="flex flex-col h-auto p-2 space-y-1 bg-transparent">
      {navItems.map((item) => (
        <Button 
          key={item.value} 
          variant="ghost"
          onClick={() => {
            onTabChange(item.value);
            closeSheet?.();
          }}
          className={cn(
            "flex items-center justify-start gap-2 w-full h-10 px-3 py-2 text-sm font-medium transition-colors",
            currentTab === item.value 
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "hover:bg-muted/50"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px] p-0 pt-10">
          <SheetHeader className="px-4">
            <SheetTitle>Navegação</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            {renderNavItems(() => setIsSheetOpen(false))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Modo Desktop
  return (
    <Card className="w-64 flex-shrink-0 p-4 h-fit sticky top-20">
      {renderNavItems()}
    </Card>
  );
};

export default AdminSidebar;