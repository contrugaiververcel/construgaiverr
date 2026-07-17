import { Button } from "@/components/ui/button";

interface CategoryButtonsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  "Todas",
  "Materiais",
  "Equipamentos",
  "Ferramentas",
  "Serviços",
  "Transporte",
  "Segurança",
];

const CategoryButtons = ({ selectedCategory, onCategoryChange }: CategoryButtonsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          size="sm"
          className="flex-shrink-0"
          onClick={() => onCategoryChange(category === "Todas" ? "" : category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryButtons;
