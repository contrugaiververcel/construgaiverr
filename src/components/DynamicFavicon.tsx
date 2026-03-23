import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const CONFIG_ID = "00000000-0000-0000-0000-000000000000";

const fetchConfig = async () => {
  const { data, error } = await supabase
    .from("configuracoes")
    .select("favicon_url")
    .eq("id", CONFIG_ID)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

const DynamicFavicon = () => {
  const { data: config } = useQuery({
    queryKey: ["homeConfig"], // Reutiliza o cache da home
    queryFn: fetchConfig,
  });

  useEffect(() => {
    if (config?.favicon_url) {
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (link) {
        link.href = config.favicon_url;
      }
    }
  }, [config?.favicon_url]);

  return null; // Este componente não renderiza nada
};

export default DynamicFavicon;