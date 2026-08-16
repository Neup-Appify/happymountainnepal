
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface TourFiltersProps {
  filters: {
    search: string;
    region: string;
    hardship: string[]; // ['low','mid','high']
  };
  setFilters: (filters: TourFiltersProps["filters"]) => void;
  regions: string[];
}

export function MinimalTourFilters({ filters, setFilters, regions }: TourFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = filters.search.trim();
    if (!term) return;
    const params = new URLSearchParams();
    if (filters.region) params.set("region", filters.region);
    if (filters.hardship && filters.hardship.length > 0) params.set("hardship", filters.hardship.join(","));
    const qs = params.toString();
    router.push(qs ? `/search/${encodeURIComponent(term)}?${qs}` : `/search/${encodeURIComponent(term)}`);
  };

  return (
    <div className="mb-8">
      {/* Full-width search bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <Input
          type="text"
          placeholder="Search by title first, then description"
          value={filters.search}
          onChange={(e) => {
            const next = { ...filters, search: e.target.value };
            setFilters(next);
          }}
          className="bg-white/90 text-foreground placeholder:text-muted-foreground w-full rounded-full py-6 pl-6 pr-16 border-2 border-primary/50 focus:border-primary focus:ring-primary/20 focus:ring-4 transition-all"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </form>
    </div>
  );
}
