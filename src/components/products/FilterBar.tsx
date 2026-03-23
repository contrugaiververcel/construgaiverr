import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  filters: {
    cidade: string;
    bairro: string;
    tipo: string;
    categoria: string;
  };
  onFiltersChange: (filters: any) => void;
}

const FilterBar = ({ filters, onFiltersChange }: FilterBarProps) => {
  
  const handleSelectChange = (key: keyof FilterBarProps['filters'], value: string) => {
    const actualValue = value === '_all' ? '' : value;
    onFiltersChange({ ...filters, [key]: actualValue });
  };

  // Mapeia o valor do filtro para o valor do Select (usa '_all' se for string vazia)
  const getSelectValue = (value: string) => (value === '' ? '_all' : value);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtrar resultados</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              placeholder="Ex: São Paulo"
              value={filters.cidade}
              onChange={(e) => onFiltersChange({ ...filters, cidade: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input
              placeholder="Ex: Centro"
              value={filters.bairro}
              onChange={(e) => onFiltersChange({ ...filters, bairro: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={getSelectValue(filters.tipo)}
              onValueChange={(value) => handleSelectChange('tipo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                <SelectItem value="Venda">Venda</SelectItem>
                <SelectItem value="Locação">Locação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={getSelectValue(filters.categoria)}
              onValueChange={(value) => handleSelectChange('categoria', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas</SelectItem>
                <SelectItem value="Materiais">Materiais</SelectItem>
                <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                <SelectItem value="Serviços">Serviços</SelectItem>
                <SelectItem value="Transporte">Transporte</SelectItem>
                <SelectItem value="Segurança">Segurança</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              onFiltersChange({ cidade: "", bairro: "", tipo: "", categoria: "" })
            }
          >
            Limpar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterBar;