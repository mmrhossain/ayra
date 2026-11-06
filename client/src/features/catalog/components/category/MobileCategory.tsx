"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
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

  const currentPath =
    category.path || (parentPath ? `${parentPath}/${category.slug}` : category.slug);

  return (
    <li className="-mb-px w-full border-y border-slate-200 last:mb-0">
      <div className="flex min-h-11 items-center" style={{ paddingLeft: `${20 + depth * 12}px` }}>
        <Link
          href={`/shop/${currentPath}`}
          onClick={onNavigate}
          className="flex flex-1 items-center gap-2.5 py-4 pr-2 text-sm font-semibold uppercase hover:bg-slate-50"
        >
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-200 border border-slate-200/60">
            {category.mobileImage ? (
              <Image
                src={category.mobileImage}
                alt={category.name}
                width={64}
                height={64}
                loading="lazy"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs font-bold uppercase text-slate-500">
                {category.name.charAt(0)}
              </div>
            )}
          </div>
          <span className="truncate">{category.name}</span>
        </Link>

        {hasChildren ? (
          <button
            type="button"
            aria-label={`Toggle ${category.name} subcategories`}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="flex h-11 w-11 items-center justify-center text-slate-500"
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
