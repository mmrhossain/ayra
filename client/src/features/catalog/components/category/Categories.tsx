import CategoryCard from "@/features/catalog/components/category/CategoryCard";
import { CategoryListItem } from "../../types";

const Categories = ({ categories }: { categories: CategoryListItem[] }) => {
  return (
    <div className="container mt-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories?.map((category) => (
          <div key={category?.id}>
            <CategoryCard category={category} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
