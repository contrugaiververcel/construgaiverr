import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useUnreadMessages from "@/hooks/useUnreadMessages";

const ChatConversation = () => {
  const { recipientId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { refetch: refetchUnreadCount } = useUnreadMessages(user?.id);

  const markMessagesAsRead = async () => {
    if (!user || !recipientId) return;
    
    const { error } = await supabase
      .from("mensagens")
      .update({ lida: true })
      .eq("destinatario_id", user.id)
      .eq("remetente_id", recipientId)
      .eq("lida", false);

    if (error) {
      console.error("Error marking messages as read:", error);
    } else {
      refetchUnreadCount();
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchRecipientInfo();
    fetchMessages().then(() => {
      markMessagesAsRead();
    });

    const channel = supabase
      .channel(`chat-${user.id}-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens",
        },
        (payload) => {
          if (
            (payload.new.remetente_id === user.id && payload.new.destinatario_id === recipientId) ||
            (payload.new.remetente_id === recipientId && payload.new.destinatario_id === user.id)
          ) {
            setMessages((prevMessages) => [...prevMessages, payload.new]);
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRecipientInfo = async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("nome, nome_empresa")
      .eq("id", recipientId)
      .single();
    if (error) toast.error("Não foi possível carregar informações do destinatário.");
    else setRecipient(data);
  };

  const fetchMessages = async () => {
    if (!user || !recipientId) return;
    const { data, error } = await supabase
      .from("mensagens")
      .select("*")
      .or(
        `and(remetente_id.eq.${user.id},destinatario_id.eq.${recipientId}),and(remetente_id.eq.${recipientId},destinatario_id.eq.${user.id})`
      )
      .order("criado_em", { ascending: true });

    if (error) toast.error("Erro ao carregar mensagens.");
    else setMessages(data || []);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !recipientId) return;

    const content = newMessage.trim();
    const { data, error } = await supabase
      .from("mensagens")
      .insert({
        remetente_id: user.id,
        destinatario_id: recipientId,
        conteudo: content,
      })
      .select()
      .single();

    if (error) toast.error("Erro ao enviar mensagem.");
    else {
      // A mensagem é mostrada pela resposta do INSERT. Assim, o remetente não
      // fica dependente da conexão Realtime para ver a própria mensagem.
      setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-muted">
      <header className="bg-card border-b p-4 flex items-center gap-4 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-lg">{recipient?.nome_empresa || recipient?.nome || "Chat"}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
              msg.remetente_id === user?.id
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-card"
            )}
          >
            {msg.conteudo}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-card border-t p-4 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            autoComplete="off"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default ChatConversation;
