import { Home, Grid, MessageCircle, ShoppingCart, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const BottomNav = () => {
  const navItems = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/categorias", icon: Grid, label: "Categorias" },
    { to: "/chat", icon: MessageCircle, label: "Chat" },
    { to: "/carrinho", icon: ShoppingCart, label: "Carrinho" },
    { to: "/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
