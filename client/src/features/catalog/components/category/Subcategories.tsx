import { CategoryListItem } from "../../types";
import CategoriesGrid from "./CategoriesGrid"; // Adjust path if needed
import CategoryHero from "./CategoryHero"; // Adjust path if needed

const Subcategories = ({
  subCategories,
  parent_category,
}: {
  subCategories: CategoryListItem[];
  parent_category: {
    name: string;
    image?: string | null;
    mobileImage?: string | null;
  };
}) => {
  return (
    <section>
      {/* Parent Category Banner */}
      <CategoryHero parent_category={parent_category} />

      {subCategories?.length ? (
        <div className="container mt-4 md:mt-6">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight text-slate-900 uppercase sm:text-3xl lg:text-4xl">
            Shop by category
          </h1>

          {/* Reusing your CategoriesGrid component here */}
          <CategoriesGrid categories={subCategories} />
        </div>
      ) : null}
    </section>
  );
};

export default Subcategories;
