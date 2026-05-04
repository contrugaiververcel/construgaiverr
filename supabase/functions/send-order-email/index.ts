import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// ── CORS: restrito às origens conhecidas da aplicação ─────────────────────────
const ALLOWED_ORIGINS = [
  "https://construgaiver.vercel.app",
  "https://www.construgaiver.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface EmailPayload {
  orderId?: string;
  itemId?: string;
  type: "CONFIRMATION" | "SALE" | "STATUS_UPDATE";
  newStatus?: string;
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── AUTH: verificar JWT do usuário chamante ────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verificar token com o cliente anon (valida JWT sem bypass de RLS)
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // ─────────────────────────────────────────────────────────────────────────────

  const logoUrl = "https://magaiver.app.br/wp-content/uploads/2026/03/Agenda_ai__15_-removebg-preview.png";
  const headerHtml = `
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f1f1f1;">
      <img src="${logoUrl}" alt="Construgaiver" style="max-height: 100px; display: inline-block;">
    </div>
  `;

  try {
    const payload: EmailPayload = await req.json();
    const { orderId, itemId, type, newStatus } = payload;

    // Cliente admin para buscar dados (bypassa RLS com service role)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    let emailTo = "";
    let subject = "";
    let html = "";

    if (type === "CONFIRMATION" && orderId) {
      // Verificar que o pedido pertence ao usuário chamante
      const { data: order, error: orderError } = await supabaseAdmin
        .from("pedidos")
        .select("*, comprador:usuarios(*), itens:itens_pedido(*, anuncio:anuncios(*))")
        .eq("id", orderId)
        .single();

      if (orderError || !order) throw new Error("Pedido não encontrado");

      // Garantir que apenas o dono do pedido pode disparar e-mail de confirmação
      if (order.usuario_id !== user.id) {
        return new Response(JSON.stringify({ error: "Acesso negado" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      emailTo = order.comprador.email;
      subject = `Pedido Confirmado #${orderId.slice(0, 8)} - Construgaiver`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          ${headerHtml}
          <h2 style="color: #000; text-align: center;">Olá, ${order.comprador.nome}!</h2>
          <p style="text-align: center; color: #666;">Seu pedido na <strong>Construgaiver</strong> foi confirmado com sucesso.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>ID do Pedido:</strong> #${orderId.slice(0, 8)}</p>
            <p><strong>Total:</strong> R$ ${order.total.toFixed(2)}</p>
          </div>
          <h3>Itens do Pedido:</h3>
          <ul style="list-style: none; padding: 0;">
            ${order.itens.map((item: any) => `
              <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                ${item.anuncio.titulo} - Qtd: ${item.quantidade} - R$ ${item.subtotal.toFixed(2)}
              </li>
            `).join("")}
          </ul>
          <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">Obrigado por comprar conosco!</p>
        </div>
      `;
    } else if (type === "SALE" && itemId) {
      const { data: item, error: itemError } = await supabaseAdmin
        .from("itens_pedido")
        .select("*, anuncio:anuncios(*, vendedor:usuarios(*)), pedido:pedidos(*, comprador:usuarios(*))")
        .eq("id", itemId)
        .single();

      if (itemError || !item) throw new Error("Item da venda não encontrado");

      // Apenas o comprador do pedido pode disparar notificação de venda
      if (item.pedido.usuario_id !== user.id) {
        return new Response(JSON.stringify({ error: "Acesso negado" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      emailTo = item.anuncio.vendedor.email;
      subject = `Você realizou uma nova venda! - Item #${itemId.slice(0, 8)}`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          ${headerHtml}
          <h2 style="color: #000; text-align: center;">Parabéns, ${item.anuncio.vendedor.nome}!</h2>
          <p style="text-align: center; color: #666;">Você tem uma nova venda na <strong>Construgaiver</strong>.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Item:</strong> ${item.anuncio.titulo}</p>
            <p><strong>Quantidade:</strong> ${item.quantidade}</p>
            <p><strong>Valor Líquido:</strong> R$ ${(item.subtotal * 0.9).toFixed(2)} (pós taxa de 10%)</p>
            <p><strong>Comprador:</strong> ${item.pedido.comprador.nome}</p>
          </div>
          <p style="text-align: center;">Acesse seu painel do vendedor para processar o envio.</p>
        </div>
      `;
    } else if (type === "STATUS_UPDATE" && itemId) {
      const { data: item, error: itemError } = await supabaseAdmin
        .from("itens_pedido")
        .select("*, anuncio:anuncios(*), pedido:pedidos(*, comprador:usuarios(*))")
        .eq("id", itemId)
        .single();

      if (itemError || !item) throw new Error("Item não encontrado");

      emailTo = item.pedido.comprador.email;
      const statusMap: any = {
        'em_transito': 'Em Trânsito',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado',
        'confirmado': 'Confirmado'
      };
      const statusLabel = statusMap[newStatus || item.status] || (newStatus || item.status);

      subject = `Status Atualizado: ${item.anuncio.titulo} - ${statusLabel}`;
      html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            ${headerHtml}
            <h2 style="color: #000; text-align: center;">Olá, ${item.pedido.comprador.nome}!</h2>
            <p style="text-align: center; color: #666;">O status do seu produto <strong>${item.anuncio.titulo}</strong> foi atualizado.</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="font-size: 18px; color: #f59e0b; font-weight: bold;">${statusLabel.toUpperCase()}</p>
            </div>
            ${item.codigo_rastreio ? `<p><strong>Código de Rastreio:</strong> ${item.codigo_rastreio}</p>` : ""}
            <p style="text-align: center;">Você pode acompanhar o progresso detalhado na sua conta.</p>
          </div>
        `;
    }

    if (!emailTo) throw new Error("Destinatário não definido");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Construgaiver <nao-responda@construgaiver.magaiver.app.br>",
        to: [emailTo],
        subject: subject,
        html: html,
      }),
    });

    const resData = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(resData));

    return new Response(JSON.stringify(resData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("Erro na Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
