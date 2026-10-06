import Link from "next/link";
import { cn } from "@/lib/utils";

export type BreadcrumbCrumb = {
  label: string;
  href?: string;
};

type PageBreadcrumbProps = {
  items: BreadcrumbCrumb[];
  className?: string;
};

const PageBreadcrumb = ({ items, className }: PageBreadcrumbProps) => {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs text-sky-color sm:text-sm",
        className,
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <span className="px-0.5 text-light-color2" aria-hidden>
                {">"}
              </span>
            ) : null}
            {isLast || !item.href ? (
              <span
                className={cn(
                  "line-clamp-1",
                  isLast ? "font-medium text-secondary" : undefined,
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default PageBreadcrumb;
