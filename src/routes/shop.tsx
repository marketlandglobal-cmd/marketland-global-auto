import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productsQuery } from "@/lib/store-data";

type ShopSearch = { category?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Shop Auto Spare Parts — Marketland Global" },
      {
        name: "description",
        content:
          "Browse and search auto spare parts by category, brand and price. Brakes, filters, electrical, suspension and lights with availability shown.",
      },
      { property: "og:title", content: "Shop Auto Spare Parts — Marketland Global" },
      {
        property: "og:description",
        content: "Search and filter genuine auto spare parts available for delivery in Nigeria.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: products, isLoading } = useQuery(productsQuery);
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState("newest");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set((products ?? []).map((p) => p.category))).sort(),
    [products],
  );

  const list = useMemo(() => {
    let items = [...(products ?? [])];
    const q = term.trim().toLowerCase();
    if (q) {
      items = items.filter((p) =>
        [p.name, p.description, p.category, p.brand ?? ""].join(" ").toLowerCase().includes(q),
      );
    }
    if (category) items = items.filter((p) => p.category === category);
    if (onlyAvailable) items = items.filter((p) => p.is_available && p.stock_quantity > 0);
    if (sort === "price-asc") items.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc") items.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, [products, term, category, onlyAvailable, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Spare parts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isLoading ? "Loading parts…" : `${list.length} part(s) available`}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search part, brand or car model"
            className="pl-9"
            maxLength={80}
          />
        </div>
        <Select
          value={category ?? "all"}
          onValueChange={(v) =>
            void navigate({ search: { category: v === "all" ? undefined : v } })
          }
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant={onlyAvailable ? "accent" : "secondary"}
          size="sm"
          onClick={() => setOnlyAvailable((v) => !v)}
        >
          In stock only
        </Button>
        {category && (
          <Button variant="ghost" size="sm" onClick={() => void navigate({ search: {} })}>
            Clear category: {category}
          </Button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
            ))
          : list.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {!isLoading && list.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No parts match your search. Try a different keyword or category.
        </p>
      )}
    </div>
  );
}
