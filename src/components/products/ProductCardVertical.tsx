import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface ProductCardVerticalProps {
  anuncio: {
    id: string;
    titulo: string;
    preco: number;
    preco_oferta?: number | null;
    tipo: string;
    cidade: string;
    bairro: string;
    imagens: string[];
  };
  showOfferBadge?: boolean;
}

const ProductCardVertical = ({ anuncio, showOfferBadge }: ProductCardVerticalProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer w-[160px] flex-shrink-0"
      onClick={() => navigate(`/produto/${anuncio.id}`)}
    >
      <div className="relative">
        <div className="w-full h-32 bg-muted">
          {anuncio.imagens?.[0] ? (
            <img
              src={anuncio.imagens[0]}
              alt={anuncio.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              Sem imagem
            </div>
          )}
        </div>
        {showOfferBadge && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
            Em oferta
          </Badge>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
          {anuncio.titulo}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="line-clamp-1">
            {anuncio.cidade}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {anuncio.preco_oferta && anuncio.preco_oferta > 0 ? (
            <div>
              <p className="text-base font-bold text-primary">
                R$ {anuncio.preco_oferta.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground line-through">
                R$ {anuncio.preco.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-base font-bold text-primary">
              R$ {anuncio.preco.toFixed(2)}
            </p>
          )}
          <Badge
            className={`text-xs w-fit ${
              anuncio.tipo === "Venda" ? "bg-primary" : "bg-accent"
            }`}
          >
            {anuncio.tipo}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default ProductCardVertical;