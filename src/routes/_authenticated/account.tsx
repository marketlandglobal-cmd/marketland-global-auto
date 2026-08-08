import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My Account — Marketland Global" },
      {
        name: "description",
        content: "Update your name, phone number and delivery address for faster checkout.",
      },
      { property: "og:title", content: "My Account — Marketland Global" },
      { property: "og:description", content: "Manage your Marketland Global account details." },
    ],
  }),
  component: AccountPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  address: z.string().trim().max(300),
});

function AccountPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", address: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      address: profile?.address ?? "",
    });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...parsed.data }, { onConflict: "id" });
    setBusy(false);
    if (error) {
      toast.error("Could not save", { description: error.message });
      return;
    }
    await refreshProfile();
    toast.success("Account details saved");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold">My account</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

      <form onSubmit={save} className="mt-6 space-y-4 p-5 surface-card">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            maxLength={80}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            maxLength={20}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="address">Delivery address</Label>
          <Textarea
            id="address"
            rows={3}
            maxLength={300}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <Button variant="hero" type="submit" disabled={busy}>
          Save changes
        </Button>
      </form>
    </div>
  );
}
