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
      className="overflow-hidden shadow-card hover:shadow-orange transition-shadow cursor-pointer"
      onClick={() => navigate(`/produto/${anuncio.id}`)}
    >
      <div className="aspect-video bg-muted relative">
        {anuncio.imagens?.[0] ? (
          <img
            src={anuncio.imagens[0]}
            alt={anuncio.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Sem imagem
          </div>
        )}
        <Badge
          className={`absolute top-2 right-2 ${
            anuncio.tipo === "Venda" ? "bg-primary" : "bg-accent"
          }`}
        >
          {anuncio.tipo}
        </Badge>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">{anuncio.titulo}</h3>
        <p className="text-2xl font-bold text-primary">
          R$ {anuncio.preco.toFixed(2)}
        </p>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {anuncio.cidade} - {anuncio.bairro}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
