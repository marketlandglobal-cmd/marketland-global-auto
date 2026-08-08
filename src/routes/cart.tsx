import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { naira } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "My Cart — Marketland Global" },
      {
        name: "description",
        content: "Review the auto spare parts in your cart and proceed to checkout.",
      },
      { property: "og:title", content: "My Cart — Marketland Global" },
      { property: "og:description", content: "Review your selected spare parts before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, total, setQuantity, remove } = useCart();
  const { user } = useAuth();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse our spare parts and add what your car needs.
        </p>
        <Button variant="hero" size="lg" className="mt-6" asChild>
          <Link to="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">My cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 p-3 surface-card">
              <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{naira(item.price)} each</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-input">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Reduce"
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Increase"
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove item"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <p className="shrink-0 font-display font-bold">
                {naira(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-3 p-4 surface-card">
          <h2 className="text-lg font-bold">Order summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items</span>
            <span>{items.length}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <span className="font-semibold">Total</span>
            <span className="font-display text-xl font-bold">{naira(total)}</span>
          </div>
          <Button variant="hero" size="lg" className="w-full" asChild>
            <Link to={user ? "/checkout" : "/auth"}>
              {user ? "Proceed to checkout" : "Sign in to checkout"}
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
