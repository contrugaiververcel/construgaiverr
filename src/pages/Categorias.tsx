import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Hammer, Wrench, Truck, HardHat, Drill, Package } from "lucide-react";

const categorias = [
  { nome: "Materiais", icon: Package, cor: "bg-primary" },
  { nome: "Equipamentos", icon: Drill, cor: "bg-accent" },
  { nome: "Ferramentas", icon: Hammer, cor: "bg-primary" },
  { nome: "Serviços", icon: Wrench, cor: "bg-accent" },
  { nome: "Transporte", icon: Truck, cor: "bg-primary" },
  { nome: "Segurança", icon: HardHat, cor: "bg-accent" },
];

const Categorias = () => {
  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <div className="grid grid-cols-2 gap-4">
          {categorias.map((categoria) => (
            <Card
              key={categoria.nome}
              className="p-6 flex flex-col items-center gap-4 cursor-pointer hover:shadow-orange transition-shadow"
            >
              <div
                className={`${categoria.cor} p-4 rounded-full text-white shadow-orange`}
              >
                <categoria.icon className="h-8 w-8" />
              </div>
              <span className="font-semibold text-center">{categoria.nome}</span>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Categorias;
