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
        <div className="mt-6 md:mt-8">
          <div className="container flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
            <div className="space-y-2">
              <span className="text-primary font-bold uppercase tracking-[0.18em] sm:tracking-[0.3em] text-[10px] md:text-xs">
                Discover the Collection
              </span>

              <h1 className="font-black uppercase text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-slate-900 tracking-tight sm:tracking-tighter">
                Shop by <span className="text-primary italic font-serif">category</span>
              </h1>
            </div>

            <p className="text-slate-400 text-sm max-w-[320px] font-medium leading-relaxed">
              Explore our handcrafted pieces rooted in the heritage of Susang Durgapur.
            </p>
          </div>

          {/* Reusing your CategoriesGrid component here */}
          <CategoriesGrid categories={subCategories} />
        </div>
      ) : null}
    </section>
  );
};

export default Subcategories;
