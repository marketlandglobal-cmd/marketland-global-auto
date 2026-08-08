import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/store-data";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Customer Service — Marketland Global" },
      {
        name: "description",
        content:
          "Contact Marketland Global customer service by phone, WhatsApp or email for help with parts, orders and delivery.",
      },
      { property: "og:title", content: "Customer Service — Marketland Global" },
      {
        property: "og:description",
        content: "Reach our support team by phone, WhatsApp or email.",
      },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { data: settings } = useQuery(settingsQuery);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Customer service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We are here to help you find the right part and track your delivery.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="p-5 surface-card">
          <Phone className="size-5 text-accent" />
          <h2 className="mt-3 text-sm font-bold uppercase tracking-wide">Call us</h2>
          <p className="mt-1 text-lg font-semibold">{settings?.support_phone || "Coming soon"}</p>
          {settings?.support_phone && (
            <Button variant="accent" size="sm" className="mt-3" asChild>
              <a href={`tel:${settings.support_phone}`}>Call now</a>
            </Button>
          )}
        </div>

        <div className="p-5 surface-card">
          <Mail className="size-5 text-accent" />
          <h2 className="mt-3 text-sm font-bold uppercase tracking-wide">Email us</h2>
          <p className="mt-1 break-all text-lg font-semibold">
            {settings?.support_email || "Coming soon"}
          </p>
          {settings?.support_email && (
            <Button variant="accent" size="sm" className="mt-3" asChild>
              <a href={`mailto:${settings.support_email}`}>Send email</a>
            </Button>
          )}
        </div>

        {settings?.whatsapp && (
          <div className="p-5 surface-card">
            <MessageCircle className="size-5 text-accent" />
            <h2 className="mt-3 text-sm font-bold uppercase tracking-wide">WhatsApp</h2>
            <p className="mt-1 text-lg font-semibold">{settings.whatsapp}</p>
            <Button variant="accent" size="sm" className="mt-3" asChild>
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        )}

        {settings?.address && (
          <div className="p-5 surface-card">
            <MapPin className="size-5 text-accent" />
            <h2 className="mt-3 text-sm font-bold uppercase tracking-wide">Visit us</h2>
            <p className="mt-1 text-lg font-semibold">{settings.address}</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-5 surface-card">
        <h2 className="text-lg font-bold">About {settings?.store_name ?? "Marketland Global"}</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
          {settings?.store_info}
        </p>
      </div>
    </div>
  );
}
