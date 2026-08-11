import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, naira } from "@/lib/format";
import { productsQuery, settingsFullQuery, type Product, type StoreSettings } from "@/lib/store-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Marketland Global" },
      {
        name: "description",
        content:
          "Store owner panel: manage products, prices, availability, orders, payment details and customer service contacts.",
      },
      { property: "og:title", content: "Admin Panel — Marketland Global" },
      { property: "og:description", content: "Manage the Marketland Global store." },
    ],
  }),
  component: AdminPage,
});

const emptyProduct = {
  id: "",
  name: "",
  description: "",
  price: "0",
  image_url: "",
  category: "General",
  brand: "",
  is_available: true,
  stock_quantity: "0",
};

type ProductForm = typeof emptyProduct;

function AdminPage() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is reserved for the store administrator.
        </p>
        <Button variant="hero" className="mt-6" asChild>
          <Link to="/">Back to store</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Admin panel</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage products, orders and store information. Changes appear instantly in the app.
      </p>

      <Tabs defaultValue="products" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="store">Store</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <ProductsAdmin />
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
          <OrdersAdmin />
        </TabsContent>
        <TabsContent value="store" className="mt-6">
          <StoreAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductsAdmin() {
  const qc = useQueryClient();
  const { data: products } = useQuery(productsQuery);
  const [form, setForm] = useState<ProductForm>(emptyProduct);

  const reset = () => setForm(emptyProduct);

  const save = useMutation({
    mutationFn: async (values: ProductForm) => {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim(),
        price: Number(values.price) || 0,
        image_url: values.image_url.trim() || null,
        category: values.category.trim() || "General",
        brand: values.brand.trim() || null,
        is_available: values.is_available,
        stock_quantity: Number(values.stock_quantity) || 0,
      };
      if (!payload.name) throw new Error("Product name is required");
      if (values.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product saved");
      reset();
    },
    onError: (e: Error) => toast.error("Could not save product", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (e: Error) => toast.error("Could not delete", { description: e.message }),
  });

  const edit = (p: Product) =>
    setForm({
      id: p.id,
      name: p.name,
      description: p.description,
      price: String(p.price),
      image_url: p.image_url ?? "",
      category: p.category,
      brand: p.brand ?? "",
      is_available: p.is_available,
      stock_quantity: String(p.stock_quantity),
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <form
        className="h-fit space-y-4 p-5 surface-card"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(form);
        }}
      >
        <h2 className="text-lg font-bold">{form.id ? "Edit product" : "Add product"}</h2>
        <div>
          <Label htmlFor="p-name">Product name</Label>
          <Input
            id="p-name"
            required
            maxLength={120}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="p-desc">Description</Label>
          <Textarea
            id="p-desc"
            rows={3}
            maxLength={1000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="p-price">Price (₦)</Label>
            <Input
              id="p-price"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="p-stock">Stock quantity</Label>
            <Input
              id="p-stock"
              type="number"
              min="0"
              step="1"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="p-cat">Category</Label>
            <Input
              id="p-cat"
              maxLength={60}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="p-brand">Brand</Label>
            <Input
              id="p-brand"
              maxLength={60}
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="p-img">Product picture</Label>
          <input
            id="p-img"
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload.mutate(file);
            }}
          />
          <div className="mt-1 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={upload.isPending}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus /> {upload.isPending ? "Uploading…" : form.image_url ? "Change picture" : "Upload picture"}
            </Button>
            {form.image_url && (
              <img
                src={form.image_url}
                alt="Product preview"
                loading="lazy"
                className="size-24 rounded-lg border border-border object-cover"
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="p-avail">Available for sale</Label>
          <Switch
            id="p-avail"
            checked={form.is_available}
            onCheckedChange={(v) => setForm({ ...form, is_available: v })}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="hero" type="submit" disabled={save.isPending}>
            <Plus /> {form.id ? "Save changes" : "Add product"}
          </Button>
          {form.id && (
            <Button variant="outline" type="button" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <ul className="space-y-3">
        {(products ?? []).map((p) => (
          <li key={p.id} className="flex gap-3 p-3 surface-card">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt={p.name}
                  loading="lazy"
                  className="size-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                {naira(p.price)} · {p.category} · stock {p.stock_quantity}
              </p>
              {!p.is_available && (
                <Badge variant="secondary" className="mt-1">
                  Hidden / out of stock
                </Badge>
              )}
            </div>
            <div className="flex shrink-0 items-start gap-1">
              <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => edit(p)}>
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                onClick={() => {
                  if (window.confirm(`Delete "${p.name}"?`)) remove.mutate(p.id);
                }}
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type AdminOrder = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  note: string | null;
  total: number;
  status: string;
  created_at: string;
  order_items: { id: string; product_name: string; unit_price: number; quantity: number }[];
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function OrdersAdmin() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async (): Promise<AdminOrder[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, product_name, unit_price, quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminOrder[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: (e: Error) => toast.error("Could not update", { description: e.message }),
  });

  if ((orders ?? []).length === 0) {
    return <p className="text-sm text-muted-foreground">No orders yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {(orders ?? []).map((o) => (
        <li key={o.id} className="p-4 surface-card">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <p className="font-display text-sm font-bold">
                #{o.id.slice(0, 8).toUpperCase()} · {o.customer_name}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
              <p className="mt-1 text-sm">
                {o.phone} — {o.address}
              </p>
              {o.note && <p className="mt-1 text-sm text-muted-foreground">Note: {o.note}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold">{naira(o.total)}</span>
              <Select
                value={o.status}
                onValueChange={(status) => setStatus.mutate({ id: o.id, status })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ul className="mt-3 border-t border-border pt-3 text-sm">
            {o.order_items.map((it) => (
              <li key={it.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted-foreground">
                  {it.product_name} × {it.quantity}
                </span>
                <span>{naira(it.unit_price * it.quantity)}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function StoreAdmin() {
  const qc = useQueryClient();
  const { data: settings } = useQuery(settingsFullQuery);
  const [form, setForm] = useState<StoreSettings | null>(null);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const save = useMutation({
    mutationFn: async (values: StoreSettings) => {
      const { error } = await supabase
        .from("store_settings")
        .update({
          store_name: values.store_name,
          store_info: values.store_info,
          bank_name: values.bank_name,
          account_name: values.account_name,
          account_number: values.account_number,
          support_phone: values.support_phone,
          support_email: values.support_email,
          whatsapp: values.whatsapp,
          address: values.address,
        })
        .eq("id", "main");
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["store_settings"] });
      toast.success("Store details saved");
    },
    onError: (e: Error) => toast.error("Could not save", { description: e.message }),
  });

  if (!form) return <p className="text-sm text-muted-foreground">Loading store details…</p>;

  const field = (
    key: keyof StoreSettings,
    label: string,
    props: { type?: string; area?: boolean } = {},
  ) => (
    <div key={key}>
      <Label htmlFor={`s-${key}`}>{label}</Label>
      {props.area ? (
        <Textarea
          id={`s-${key}`}
          rows={3}
          maxLength={600}
          value={(form[key] as string) ?? ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ) : (
        <Input
          id={`s-${key}`}
          type={props.type ?? "text"}
          maxLength={160}
          value={(form[key] as string) ?? ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <form
      className="grid max-w-3xl gap-4 p-5 surface-card"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(form);
      }}
    >
      <h2 className="text-lg font-bold">Store information</h2>
      {field("store_name", "Store name")}
      {field("store_info", "About the store", { area: true })}
      {field("address", "Store address")}

      <h2 className="mt-2 text-lg font-bold">Payment / account details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("bank_name", "Bank name")}
        {field("account_name", "Account name")}
        {field("account_number", "Account number")}
      </div>

      <h2 className="mt-2 text-lg font-bold">Customer service</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("support_phone", "Phone number", { type: "tel" })}
        {field("support_email", "Email address", { type: "email" })}
        {field("whatsapp", "WhatsApp number", { type: "tel" })}
      </div>

      <Button variant="hero" type="submit" disabled={save.isPending} className="w-fit">
        Save store details
      </Button>
    </form>
  );
}
