import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, naira } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — Marketland Global" },
      {
        name: "description",
        content: "Track the status of your Marketland Global spare parts orders and deliveries.",
      },
      { property: "og:title", content: "My Orders — Marketland Global" },
      { property: "og:description", content: "Check your order status and delivery progress." },
    ],
  }),
  component: OrdersPage,
});

type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  created_at: string;
  order_items: { id: string; product_name: string; unit_price: number; quantity: number }[];
};

const statusTone: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  confirmed: "bg-accent text-accent-foreground",
  shipped: "bg-accent text-accent-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

function OrdersPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, product_name, unit_price, quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">My orders</h1>

      {isLoading && <Skeleton className="mt-6 h-28 w-full rounded-xl" />}

      {!isLoading && (data ?? []).length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">You have not placed any order yet.</p>
          <Button variant="hero" className="mt-5" asChild>
            <Link to="/shop">Start shopping</Link>
          </Button>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {(data ?? []).map((order) => (
          <li key={order.id} className="p-4 surface-card">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
              </div>
              <Badge className={statusTone[order.status] ?? "bg-secondary"}>{order.status}</Badge>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {order.order_items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {it.product_name} × {it.quantity}
                  </span>
                  <span className="shrink-0">{naira(it.unit_price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Delivering to {order.address}</span>
              <span className="font-display font-bold">{naira(order.total)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
