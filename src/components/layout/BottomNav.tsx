import { Home, Grid, MessageCircle, ShoppingCart, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import useUnreadMessages from "@/hooks/useUnreadMessages";

const BottomNav = () => {
  const { user, userRole } = useAuth();
  const { unreadCount } = useUnreadMessages(user?.id);

  const navItems = [
    { to: "/home", icon: Home, label: "Início" },
    { to: "/carrinho", icon: ShoppingCart, label: "Carrinho" },
    { 
      to: userRole === "vendedor" ? "/novo-anuncio" : "/todos-anuncios", 
      icon: Grid, 
      label: userRole === "vendedor" ? "Anunciar" : "Anúncios"
    },
    { to: "/chat", icon: MessageCircle, label: "Chat" },
    { to: "/perfil", icon: User, label: "Painel" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary relative w-16"
            activeClassName="text-primary"
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.label === "Chat" && unreadCount > 0 && (
                <span className="absolute -top-2 -right-3 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;