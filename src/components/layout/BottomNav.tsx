import { useState, useEffect } from "react";
import { Home, Grid, MessageCircle, ShoppingCart, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";

const BottomNav = () => {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        setUserRole(data?.role || "cliente");
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
          setUserRole(data?.role || "cliente");
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const navItems = [
    { to: "/home", icon: Home, label: "Início" },
    { to: "/carrinho", icon: ShoppingCart, label: "Carrinho" },
    { 
      to: userRole === "vendedor" ? "/novo-anuncio" : "/todos-anuncios", 
      icon: Grid, 
      label: "Anunciar" 
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
