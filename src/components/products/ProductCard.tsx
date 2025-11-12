import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface ProductCardProps {
  anuncio: {
    id: string;
    titulo: string;
    preco: number;
    tipo: string;
    cidade: string;
    bairro: string;
    imagens: string[];
  };
}

const ProductCard = ({ anuncio }: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-row h-28"
      onClick={() => navigate(`/produto/${anuncio.id}`)}
    >
      <div className="w-28 h-full bg-muted relative flex-shrink-0">
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
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm line-clamp-1">{anuncio.titulo}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">
              {anuncio.cidade} - {anuncio.bairro}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-primary">
            R$ {anuncio.preco.toFixed(2)}
          </p>
          <Badge
            className={`text-xs ${
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

export default ProductCard;
