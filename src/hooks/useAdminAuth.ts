import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useAdminAuth = () => {
  const navigate = useNavigate();

  // O check real de admin agora é feito no AdminRoute (Server-side)
  // Este hook fica apenas responsável pela ação de Logout.
  
  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  return { isAdmin: true, loading: false, logout };
};