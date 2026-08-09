import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { naira } from "@/lib/format";
import { settingsFullQuery } from "@/lib/store-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Marketland Global" },
      {
        name: "description",
        content:
          "Complete your order: enter your name, phone number and delivery address, then review your order summary and payment details.",
      },
      { property: "og:title", content: "Checkout — Marketland Global" },
      { property: "og:description", content: "Complete your spare parts order securely." },
    ],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  address: z.string().trim().min(10, "Enter your full delivery address").max(300),
  note: z.string().trim().max(300),
});

function CheckoutPage() {
  const { user, profile } = useAuth();
  const { items, total, clear } = useCart();
  const { data: settings } = useQuery(settingsFullQuery);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ customer_name: "", phone: "", address: "", note: "" });

  useEffect(() => {
    setForm((f) => ({
      ...f,
      customer_name: f.customer_name || (profile?.full_name ?? ""),
      phone: f.phone || (profile?.phone ?? ""),
      address: f.address || (profile?.address ?? ""),
    }));
  }, [profile]);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }

    setBusy(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_name: parsed.data.customer_name,
        phone: parsed.data.phone,
        address: parsed.data.address,
        note: parsed.data.note || null,
        total,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !order) {
      setBusy(false);
      toast.error("Could not place order", { description: error?.message });
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        unit_price: i.price,
        quantity: i.quantity,
      })),
    );
    setBusy(false);

    if (itemsError) {
      toast.error("Order saved but items failed", { description: itemsError.message });
      return;
    }

    clear();
    toast.success("Order placed!", { description: "We will contact you to confirm delivery." });
    void navigate({ to: "/orders" });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <Button variant="hero" className="mt-5" asChild>
          <Link to="/shop">Browse spare parts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={placeOrder} className="space-y-4 p-5 surface-card">
          <h2 className="text-lg font-bold">Delivery details</h2>
          <div>
            <Label htmlFor="cname">Full name</Label>
            <Input
              id="cname"
              required
              maxLength={80}
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="cphone">Phone number</Label>
            <Input
              id="cphone"
              type="tel"
              required
              maxLength={20}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="caddr">Delivery address</Label>
            <Textarea
              id="caddr"
              rows={3}
              required
              maxLength={300}
              placeholder="House number, street, area, city, state"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="cnote">Order note (optional)</Label>
            <Textarea
              id="cnote"
              rows={2}
              maxLength={300}
              placeholder="Car model, year, or any special instruction"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <Button variant="hero" size="lg" type="submit" disabled={busy} className="w-full">
            Place order · {naira(total)}
          </Button>
        </form>

        <aside className="h-fit space-y-5">
          <div className="p-5 surface-card">
            <h2 className="text-lg font-bold">Order summary</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {i.name} × {i.quantity}
                  </span>
                  <span className="shrink-0 font-semibold">{naira(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-border pt-3">
              <span className="font-semibold">Total</span>
              <span className="font-display text-xl font-bold">{naira(total)}</span>
            </div>
          </div>

          <div className="p-5 surface-card">
            <div className="flex items-center gap-2">
              <Landmark className="size-5 text-accent" />
              <h2 className="text-lg font-bold">Payment details</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Pay into the account below and send proof to customer service. Your order is confirmed
              once payment is received.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="font-semibold">{settings?.bank_name || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Account name</dt>
                <dd className="text-right font-semibold">{settings?.account_name || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Account number</dt>
                <dd className="font-display text-base font-bold">
                  {settings?.account_number || "—"}
                </dd>
              </div>
            </dl>
            {settings?.support_phone && (
              <p className="mt-4 text-xs text-muted-foreground">
                Payment questions? Call {settings.support_phone}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
