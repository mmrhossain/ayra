"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const SearchBox = ({
  className = "",
  onClose,
}: {
  className?: string;
  onClose?: () => void;
}) => {
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  const handleSearchProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchValue.trim();
    if (!query) return;

    onClose?.();
    // Navigate directly to the shop page with the search query param
    router.push(`/shop?search=${encodeURIComponent(query)}`);
    setSearchValue("");
  };

  return (
    <form
      onSubmit={handleSearchProduct}
      className={`h-full flex items-center w-full relative group transition-all duration-300 focus-within:border-primary ${className}`}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        aria-label="Search"
        className="absolute left-0 h-11 w-11 p-0 text-muted-foreground hover:bg-transparent group-focus-within:text-primary transition-colors"
      >
        <Search className="h-4 w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" />
      </Button>

      <Input
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        type="text"
        enterKeyHint="search"
        autoComplete="off"
        aria-label="Search products"
        placeholder="Search products..."
        className="h-11 min-h-11 border-0 bg-transparent py-0 pr-12 pl-11 text-base placeholder:font-normal focus-visible:ring-0 xl:pl-12"
      />

      {searchValue ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setSearchValue("")}
          className="absolute right-1 flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <X size={18} />
        </button>
      ) : null}
    </form>
  );
};

export default SearchBox;
