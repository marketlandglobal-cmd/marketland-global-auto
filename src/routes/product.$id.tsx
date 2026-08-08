import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ImageOff, Minus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/useCart";
import { naira } from "@/lib/format";
import { productQuery, settingsQuery } from "@/lib/store-data";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product details — Marketland Global" },
      {
        name: "description",
        content:
          "See full details, price and availability for this auto spare part, then add it to your cart.",
      },
      { property: "og:title", content: "Product details — Marketland Global" },
      {
        property: "og:description",
        content: "Full description, price and availability for this auto spare part.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(id));
  const { data: settings } = useQuery(settingsQuery);
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Part not found</h1>
        <Button variant="accent" className="mt-4" asChild>
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const soldOut = !product.is_available || product.stock_quantity <= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-muted surface-card">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="grid size-full place-items-center text-muted-foreground">
              <ImageOff className="size-10" />
            </span>
          )}
        </div>

        <div className="min-w-0">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.category}
            {product.brand ? ` • ${product.brand}` : ""}
          </span>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.name}</h1>
          <p className="mt-3 font-display text-3xl font-bold">{naira(product.price)}</p>
          <div className="mt-3">
            {soldOut ? (
              <Badge variant="secondary">Out of stock</Badge>
            ) : (
              <Badge className="bg-success text-success-foreground">
                In stock ({product.stock_quantity} available)
              </Badge>
            )}
          </div>

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-input">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Reduce quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus />
              </Button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
              >
                <Plus />
              </Button>
            </div>
            <Button
              variant="hero"
              size="lg"
              disabled={soldOut}
              onClick={() => {
                add(
                  {
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    image_url: product.image_url,
                  },
                  qty,
                );
                toast.success("Added to cart", { description: product.name });
              }}
            >
              Add to cart
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/cart">Go to cart</Link>
            </Button>
          </div>

          {settings?.support_phone && (
            <p className="mt-6 text-sm text-muted-foreground">
              Not sure this fits your car? Call{" "}
              <a className="font-semibold text-foreground" href={`tel:${settings.support_phone}`}>
                {settings.support_phone}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
