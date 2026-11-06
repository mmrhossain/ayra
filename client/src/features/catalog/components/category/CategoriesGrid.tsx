import { CategoryListItem } from "../../types";
import CategoryCard from "./CategoryCard";

export default function CategoriesGrid({ categories }: { categories: CategoryListItem[] }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="mt-4 md:mt-6">
      <div className="grid grid-cols-2 gap-5 antialiased sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((item) => (
          <CategoryCard key={item.id} category={item} />
        ))}
      </div>
    </section>
  );
}
