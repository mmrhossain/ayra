import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CategoryListItem } from "../../types";

const MobileCategoryItem = ({
  category,
  onNavigate,
  depth = 0,
  parentPath = "",
}: {
  category: CategoryListItem;
  onNavigate?: () => void;
  depth?: number;
  parentPath?: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  const children = category.children ?? [];
  const hasChildren = children.length > 0;

  const currentPath = parentPath ? `${parentPath}/${category.slug}` : category.slug;

  return (
    <li>
      <div className="flex items-center" style={{ paddingLeft: `${20 + depth * 12}px` }}>
        <Link
          href={`/shop/${currentPath}`}
          onClick={onNavigate}
          className="flex-1 py-4 pr-2 text-sm font-semibold uppercase hover:bg-slate-50"
        >
          {category.name}
        </Link>

        {hasChildren ? (
          <button
            type="button"
            aria-label={`Toggle ${category.name} subcategories`}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="h-11 w-11 flex items-center justify-center text-slate-500"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
      </div>

      {hasChildren && expanded ? (
        <ul className="bg-slate-50">
          {children.map((child) => (
            <MobileCategoryItem
              key={child.id}
              category={child}
              onNavigate={onNavigate}
              depth={depth + 1}
              parentPath={currentPath}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

export default MobileCategoryItem;
