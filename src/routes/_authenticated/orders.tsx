import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileUp, Receipt } from "lucide-react";

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
  receipt_path: string | null;
  receipt_submitted_at: string | null;
  receipt_rejection_reason: string | null;
  order_items: { id: string; product_name: string; unit_price: number; quantity: number }[];
};

const statusTone: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  payment_verification_pending: "bg-secondary text-secondary-foreground",
  payment_confirmed: "bg-success text-success-foreground",
  receipt_rejected: "bg-destructive text-destructive-foreground",
  confirmed: "bg-accent text-accent-foreground",
  shipped: "bg-accent text-accent-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const statusLabel: Record<string, string> = {
  payment_verification_pending: "Payment verification pending",
  payment_confirmed: "Payment confirmed",
  receipt_rejected: "Payment receipt rejected",
};

const ACCEPTED = "image/jpeg,image/jpg,image/png,application/pdf";

function ReceiptUpload({ order }: { order: OrderRow }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async (selected: File) => {
      const ext = selected.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${order.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-receipts")
        .upload(path, selected, {
          contentType: selected.type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) throw upErr;
      const { error } = await supabase.rpc("submit_payment_receipt", {
        _order_id: order.id,
        _receipt_path: path,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setFile(null);
      setPreviewUrl(null);
      await qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Receipt submitted for verification");
    },
    onError: (e: Error) => toast.error("Could not submit receipt", { description: e.message }),
  });

  const awaitingReview = order.status === "payment_verification_pending";

  return (
    <div className="mt-3 rounded-lg border border-border p-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Receipt className="size-4" /> Upload Payment Receipt
      </p>

      {order.status === "receipt_rejected" && (
        <p className="mt-1 text-xs text-destructive">
          Payment receipt rejected
          {order.receipt_rejection_reason ? ` — ${order.receipt_rejection_reason}` : ""}. Please
          upload a new receipt.
        </p>
      )}
      {awaitingReview && (
        <p className="mt-1 text-xs text-muted-foreground">
          Receipt received{order.receipt_submitted_at ? ` on ${formatDate(order.receipt_submitted_at)}` : ""}.
          We are verifying your payment.
        </p>
      )}
      {!awaitingReview && order.status !== "receipt_rejected" && (
        <p className="mt-1 text-xs text-muted-foreground">
          After paying, upload your proof of payment (JPG, PNG or PDF) here — no need to call us.
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0] ?? null;
          e.target.value = "";
          setFile(selected);
          setPreviewUrl(
            selected && selected.type.startsWith("image/") ? URL.createObjectURL(selected) : null,
          );
        }}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          <FileUp /> {file ? "Change receipt" : "Upload Receipt"}
        </Button>
        {file && (
          <Button
            type="button"
            variant="hero"
            disabled={submit.isPending}
            onClick={() => submit.mutate(file)}
          >
            {submit.isPending ? "Submitting…" : "Submit Receipt for Verification"}
          </Button>
        )}
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="size-20 rounded-lg border border-border object-cover"
            />
          ) : (
            <span className="rounded-lg border border-border px-3 py-2 text-xs">PDF</span>
          )}
          <span className="min-w-0 truncate text-xs text-muted-foreground">{file.name}</span>
        </div>
      )}
    </div>
  );
}

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
              <Badge className={statusTone[order.status] ?? "bg-secondary"}>
                {statusLabel[order.status] ?? order.status}
              </Badge>
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
            <ReceiptUpload order={order} />
          </li>
        ))}
      </ul>
    </div>
  );
}
