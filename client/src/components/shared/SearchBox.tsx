"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StoreImage from "@/components/shared/store-image";
import {
  fetchProductList,
  productPrice,
  toCatalogErrorMessage,
} from "@/features/catalog/api";
import type { ProductListItem } from "@/features/catalog/types";
import { formatPrice } from "@/helpers";

const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 6;

const SearchBox = ({
  className = "",
  onClose,
}: {
  className?: string;
  onClose?: () => void;
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = `search-suggestions-${useId()}`;
  const normalizedValue = searchValue.trim();
  const deferredValue = useDeferredValue(normalizedValue);

  useEffect(() => {
    if (deferredValue.length < MIN_QUERY_LENGTH) return;

    const timeout = window.setTimeout(
      () => setDebouncedValue(deferredValue),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [deferredValue]);

  const queryValue =
    normalizedValue.length >= MIN_QUERY_LENGTH &&
    normalizedValue === deferredValue &&
    deferredValue === debouncedValue
      ? debouncedValue
      : "";

  const suggestionsQuery = useQuery({
    queryKey: ["storefront-product-search-suggestions", queryValue],
    queryFn: () =>
      fetchProductList({
        page: 1,
        limit: SUGGESTION_LIMIT,
        search: queryValue,
        includeInactive: false,
      }),
    enabled: queryValue.length >= MIN_QUERY_LENGTH,
    staleTime: 30_000,
    retry: 0,
  });

  const suggestions =
    queryValue === normalizedValue
      ? (suggestionsQuery.data?.items ?? [])
      : [];
  const isOpen =
    isFocused && normalizedValue.length >= MIN_QUERY_LENGTH;
  const isWaitingForDebounce =
    normalizedValue.length >= MIN_QUERY_LENGTH &&
    normalizedValue !== queryValue;
  const isLoading =
    isWaitingForDebounce ||
    (suggestionsQuery.isFetching && !suggestionsQuery.data);

  useEffect(() => {
    if (!isFocused) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsFocused(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isFocused]);

  const closeSearch = () => {
    setIsFocused(false);
    setActiveIndex(-1);
    onClose?.();
  };

  const handleSearchProduct = (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizedValue) return;

    closeSearch();
    router.push(`/shop?search=${encodeURIComponent(normalizedValue)}`);
    setSearchValue("");
  };

  const handleSuggestionSelect = (product: ProductListItem) => {
    closeSearch();
    setSearchValue("");
    router.push(`/product-details/${product.slug}`);
  };

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Escape") {
      setIsFocused(false);
      setActiveIndex(-1);
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const selected = suggestions[activeIndex];
      if (selected) handleSuggestionSelect(selected);
    }
  };

  return (
    <div ref={rootRef} className="relative h-full w-full">
      <form
        onSubmit={handleSearchProduct}
        className={`group relative flex h-full w-full items-center transition-all duration-300 focus-within:border-primary ${className}`}
      >
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          aria-label="Search"
          className="absolute left-0 h-11 w-11 p-0 text-muted-foreground transition-colors hover:bg-transparent group-focus-within:text-primary"
        >
          <Search className="h-4 w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" />
        </Button>

        <Input
          ref={inputRef}
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
            setIsFocused(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleInputKeyDown}
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          role="combobox"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={
            isOpen && activeIndex >= 0
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          placeholder="Search products..."
          className="h-11 min-h-11 border-0 bg-transparent py-0 pr-12 pl-11 text-base placeholder:font-normal focus-visible:ring-0 xl:pl-12"
        />

        {searchValue ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setSearchValue("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-1 flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={18} />
          </button>
        ) : null}
      </form>

      {isOpen ? (
        <div className="absolute inset-x-0 top-full z-[100] mt-1 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
          <div
            id={listboxId}
            role="listbox"
            aria-label="Product suggestions"
            className="max-h-[min(60dvh,22rem)] overflow-y-auto p-2"
          >
            {isLoading ? (
              <div
                className="space-y-2 p-1"
                role="status"
                aria-label="Loading product suggestions"
              >
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg p-2"
                  >
                    <div className="size-12 shrink-0 animate-pulse rounded-md bg-muted" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestionsQuery.isError && !suggestionsQuery.data ? (
              <p role="alert" className="px-3 py-5 text-center text-sm text-muted-foreground">
                {toCatalogErrorMessage(suggestionsQuery.error)}
              </p>
            ) : suggestions.length > 0 ? (
              <div>
                {suggestions.map((product, index) => {
                  const price = productPrice(product);
                  return (
                    <Link
                      key={product.id}
                      id={`${listboxId}-option-${index}`}
                      href={`/product-details/${product.slug}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        closeSearch();
                        setSearchValue("");
                      }}
                      className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                        activeIndex === index
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/70"
                      }`}
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        {product.images?.[0]?.imageUrl ? (
                          <StoreImage
                            src={product.images[0].imageUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <Search className="absolute inset-0 m-auto size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-snug">
                          {product.name}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-primary">
                          {price == null ? "Price unavailable" : formatPrice(price)}
                        </p>
                      </div>
                      {product.category?.name ? (
                        <span className="hidden max-w-24 truncate text-xs text-muted-foreground sm:block">
                          {product.category.name}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-5 text-center text-sm text-muted-foreground">
                No products found for “{normalizedValue}”.
              </p>
            )}
          </div>

          <Link
            href={`/shop?search=${encodeURIComponent(normalizedValue)}`}
            onClick={() => {
              closeSearch();
              setSearchValue("");
            }}
            className="block border-t border-border px-4 py-3 text-center text-sm font-medium text-primary transition-colors hover:bg-accent/70"
          >
            View all results for “{normalizedValue}”
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default SearchBox;
