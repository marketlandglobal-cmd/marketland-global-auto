import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { naira } from "@/lib/format";
import type { Product } from "@/lib/store-data";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const soldOut = !product.is_available || product.stock_quantity <= 0;

  return (
    <article className="group flex flex-col overflow-hidden surface-card transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)]">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-brand-tint"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-8" />
          </span>
        )}
        {soldOut && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Out of stock
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {product.category}
        </span>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="line-clamp-2 text-sm font-semibold hover:text-primary"
        >
          {product.name}
        </Link>
        <p className="font-display text-lg font-bold">{naira(product.price)}</p>
        <Button
          variant={soldOut ? "secondary" : "hero"}
          size="sm"
          disabled={soldOut}
          className="mt-auto"
          onClick={() => {
            add({
              id: product.id,
              name: product.name,
              price: Number(product.price),
              image_url: product.image_url,
            });
            toast.success("Added to cart", { description: product.name });
          }}
        >
          {soldOut ? "Unavailable" : "Add to cart"}
        </Button>
      </div>
    </article>
  );
}
