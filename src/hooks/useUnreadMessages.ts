import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const fetchUnreadCount = async (userId: string | undefined) => {
  if (!userId) return 0;

  const { count, error } = await supabase
    .from("mensagens")
    .select("*", { count: "exact", head: true })
    .eq("destinatario_id", userId)
    .eq("lida", false);

  if (error) {
    console.error("Error fetching unread messages count:", error);
    return 0;
  }

  return count || 0;
};

const useUnreadMessages = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: unreadCount, refetch } = useQuery({
    queryKey: ["unreadMessages", userId],
    queryFn: () => fetchUnreadCount(userId),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`unread-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mensagens",
          filter: `destinatario_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unreadMessages", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return { unreadCount: unreadCount || 0, refetch };
};

export default useUnreadMessages;