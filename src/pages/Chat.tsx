import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Conversation {
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
}

const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chat-list-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens",
          filter: `destinatario_id=eq.${user.id}`,
        },
        fetchConversations,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens",
          filter: `remetente_id=eq.${user.id}`,
        },
        fetchConversations,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("mensagens")
        .select("*, remetente:usuarios!mensagens_remetente_id_fkey(id, nome, nome_empresa), destinatario:usuarios!mensagens_destinatario_id_fkey(id, nome, nome_empresa)")
        .or(`remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
        .order("criado_em", { ascending: false });

      if (error) throw error;

      const convMap = new Map<string, Conversation>();
      data?.forEach((msg: any) => {
        const otherUser = msg.remetente_id === user.id ? msg.destinatario : msg.remetente;
        if (otherUser && !convMap.has(otherUser.id)) {
          convMap.set(otherUser.id, {
            other_user_id: otherUser.id,
            other_user_name: otherUser.nome_empresa || otherUser.nome,
            last_message: msg.conteudo,
            last_message_time: msg.criado_em,
          });
        }
      });

      setConversations(Array.from(convMap.values()));
    } catch (error: any) {
      toast.error("Erro ao carregar conversas");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold">Conversas</h1>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Faça login para ver suas conversas</p>
            <Button onClick={() => navigate("/auth")}>Fazer Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Conversas</h1>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma conversa ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Card 
                key={conv.other_user_id} 
                className="p-4 cursor-pointer hover:shadow-orange"
                onClick={() => navigate(`/chat/${conv.other_user_id}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(conv.other_user_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{conv.other_user_name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {conv.last_message}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Chat;
