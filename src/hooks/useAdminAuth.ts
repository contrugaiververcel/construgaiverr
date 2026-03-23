import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_SESSION_KEY = "construgaiver_admin_session";

export const useAdminAuth = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (session === "true") {
      setIsAdmin(true);
    } else {
      navigate("/admin-login");
    }
    setLoading(false);
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    navigate("/admin-login");
  };

  return { isAdmin, loading, logout };
};