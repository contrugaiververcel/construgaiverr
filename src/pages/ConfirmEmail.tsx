import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const ConfirmEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>(location.state?.email || "");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) setEmail(localStorage.getItem("pendingConfirmationEmail") || "");
  }, [email]);

  const confirmEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      toast.error("Informe o e-mail usado no cadastro para confirmar o código.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    setLoading(false);

    if (error) {
      toast.error("Código inválido ou expirado. Confira o e-mail e tente novamente.");
      return;
    }

    localStorage.removeItem("pendingConfirmationEmail");
    toast.success("E-mail confirmado! Sua conta já está ativa.");
    navigate("/home");
  };

  const resendCode = async () => {
    if (!email) {
      toast.error("Informe o e-mail usado no cadastro para reenviar o código.");
      return;
    }

    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);

    if (error) {
      toast.error(error.message || "Não foi possível reenviar o código agora.");
      return;
    }
    toast.success("Enviamos um novo código para o seu e-mail.");
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-background">
        <div className="text-center space-y-2">
          <div className="inline-block p-2 rounded-lg bg-primary shadow-lg">
            <img src={logo} alt="Construgaiver" className="h-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold">Confirme seu e-mail</h1>
          <p className="text-sm text-muted-foreground">
            Digite o código de 6 dígitos enviado para o seu e-mail.
          </p>
        </div>

        <form onSubmit={confirmEmail} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Código de confirmação</Label>
            <InputOTP maxLength={6} value={token} onChange={setToken} containerClassName="justify-center">
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" className="w-full" disabled={loading || token.length !== 6}>
            {loading ? "Confirmando..." : "Confirmar cadastro"}
          </Button>
        </form>

        <div className="text-center text-sm space-y-3">
          <p className="text-muted-foreground">Não recebeu o código?</p>
          <Button type="button" variant="link" className="p-0 h-auto" onClick={resendCode} disabled={resending}>
            {resending ? "Reenviando..." : "Reenviar código"}
          </Button>
          <div>
            <Button type="button" variant="link" className="p-0 h-auto" onClick={() => navigate("/auth")}>
              Voltar para o login
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmEmail;
