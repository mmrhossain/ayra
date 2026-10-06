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
        className="absolute left-0 p-0 hover:bg-transparent text-muted-foreground group-focus-within:text-primary transition-colors"
      >
        <Search className="h-4 w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" />
      </Button>

      <Input
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        type="text"
        placeholder="Search products..."
        className="pl-8 xl:pl-10 pr-8 border-0 py-6 rounded-none focus-visible:ring-0 bg-transparent text-[13px] 2xl:text-base placeholder:font-light tracking-wide"
      />

      {searchValue && (
        <X
          size={18}
          role="button"
          tabIndex={0}
          onClick={() => setSearchValue("")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSearchValue("");
          }}
          className="absolute right-3 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
        />
      )}
    </form>
  );
};

export default SearchBox;
