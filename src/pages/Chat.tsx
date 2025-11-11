import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ChatPreview {
  id: string;
  nome: string;
  ultima_mensagem: string;
  criado_em: string;
}

const Chat = () => {
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from("mensagens")
        .select("*, destinatario:usuarios!mensagens_destinatario_id_fkey(nome)")
        .eq("remetente_id", user.id)
        .order("criado_em", { ascending: false });

      if (error) throw error;

      // Group by destinatario and get last message
      const chatMap = new Map();
      data?.forEach((msg: any) => {
        if (!chatMap.has(msg.destinatario_id)) {
          chatMap.set(msg.destinatario_id, {
            id: msg.destinatario_id,
            nome: msg.destinatario?.nome || "Usuário",
            ultima_mensagem: msg.conteudo,
            criado_em: msg.criado_em,
          });
        }
      });

      setChats(Array.from(chatMap.values()));
    } catch (error: any) {
      toast.error("Erro ao carregar conversas");
    }
  };

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Conversas</h1>
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma conversa ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <Card key={chat.id} className="p-4 cursor-pointer hover:shadow-orange">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{chat.nome}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {chat.ultima_mensagem}
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
