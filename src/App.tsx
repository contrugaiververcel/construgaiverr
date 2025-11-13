import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Splash from "./pages/Splash";
import Home from "./pages/Home";
import Categorias from "./pages/Categorias";
import Chat from "./pages/Chat";
import Carrinho from "./pages/Carrinho";
import Perfil from "./pages/Perfil";
import Auth from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import MeusAnuncios from "./pages/MeusAnuncios";
import NovoAnuncio from "./pages/NovoAnuncio";
import TodosAnuncios from "./pages/TodosAnuncios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/home" element={<Home />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/produto/:id" element={<ProductDetail />} />
          <Route path="/meus-anuncios" element={<MeusAnuncios />} />
          <Route path="/novo-anuncio" element={<NovoAnuncio />} />
          <Route path="/todos-anuncios" element={<TodosAnuncios />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
