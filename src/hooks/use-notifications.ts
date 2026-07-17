import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type Notification = Tables<'notificacoes'>;

const fetchNotifications = async (userId: string | undefined): Promise<Notification[]> => {
  if (!userId) {
    // Se não houver userId, buscamos apenas notificações globais (anon)
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .is("usuario_id", null)
      .order("criado_em", { ascending: false });
      
    if (error) throw error;
    return data || [];
  }
  
  // Se houver userId, buscamos notificações pessoais OU globais (authenticated)
  const { data, error } = await supabase
    .from("notificacoes")
    .select("*")
    .or(`usuario_id.eq.${userId},usuario_id.is.null`)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data || [];
};

const useNotifications = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: allNotifications, isLoading, refetch } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId),
    enabled: true, // Sempre habilitado para buscar notificações globais mesmo sem login
    refetchInterval: 1000 * 60 * 5, // Refetch a cada 5 minutos
  });
  
  // Lista de notificações não lidas (pessoais e globais) para exibição na lista
  const notifications = allNotifications?.filter(n => !n.lida) || [];

  // Contagem de não lidas (pessoais E globais) para o ícone de badge
  const unreadCount = allNotifications?.filter(n => !n.lida && (n.usuario_id === userId || n.usuario_id === null)).length || 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // Apenas marca como lida se for uma notificação pessoal (RLS só permite update em notificações do próprio usuário)
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("id", notificationId)
        .eq("usuario_id", userId); // Adicionando filtro de userId para garantir RLS

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
    onError: (error) => {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      
      // Marca como lida todas as notificações não lidas destinadas ao usuário
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("lida", false)
        .eq("usuario_id", userId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
    onError: (error) => {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  });

  return {
    notifications,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    unreadCount,
    refetch,
  };
};

export default useNotifications;