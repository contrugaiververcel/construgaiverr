import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import DynamicFavicon from "./components/DynamicFavicon";
import Splash from "./pages/Splash";
import Home from "./pages/Home";
import Categorias from "./pages/Categorias";
import Chat from "./pages/Chat";
import ChatConversation from "./pages/ChatConversation"; // Nova importação
import Carrinho from "./pages/Carrinho";
import Perfil from "./pages/Perfil";
import Auth from "./pages/Auth";
import ConfirmEmail from "./pages/ConfirmEmail";
import ProductDetail from "./pages/ProductDetail";
import MeusAnuncios from "./pages/MeusAnuncios";
import NovoAnuncio from "./pages/NovoAnuncio";
import TodosAnuncios from "./pages/TodosAnuncios";
import Checkout from "./pages/Checkout";
import Favoritos from "./pages/Favoritos";
import Pedidos from "./pages/Pedidos";
import EditarAnuncio from "./pages/EditarAnuncio";
import EditarPerfil from "./pages/EditarPerfil";
import PainelVendedor from "./pages/PainelVendedor";
import PerfilVendedor from "./pages/PerfilVendedor";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import AdminRoute from "./components/admin/AdminRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DynamicFavicon />
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/home" element={<Home />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:recipientId" element={<ChatConversation />} /> {/* Nova rota */}
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/editar-perfil" element={<EditarPerfil />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/confirmar-email" element={<ConfirmEmail />} />
            <Route path="/produto/:id" element={<ProductDetail />} />
            <Route path="/anuncio/:id" element={<ProductDetail />} />
            <Route path="/meus-anuncios" element={<MeusAnuncios />} />
            <Route path="/novo-anuncio" element={<NovoAnuncio />} />
            <Route path="/editar-anuncio/:id" element={<EditarAnuncio />} />
            <Route path="/todos-anuncios" element={<TodosAnuncios />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/painel-vendedor" element={<PainelVendedor />} />
            <Route path="/perfil-vendedor/:id" element={<PerfilVendedor />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/gerenciar-painel-administrativo"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
