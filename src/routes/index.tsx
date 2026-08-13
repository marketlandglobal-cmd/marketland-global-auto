import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Truck, Headphones } from "lucide-react";

import heroImage from "@/assets/hero-parts.jpg";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { productsQuery } from "@/lib/store-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marketland Global — Buy Auto Spare Parts Online in Nigeria" },
      {
        name: "description",
        content:
          "Marketland Global sells genuine auto spare parts in Nigeria: brake pads, filters, alternators, suspension and lights, with nationwide delivery.",
      },
      { property: "og:title", content: "Marketland Global — Auto Spare Parts Store" },
      {
        property: "og:description",
        content: "Shop genuine auto spare parts with fast nationwide delivery in Nigeria.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: products, isLoading } = useQuery(productsQuery);
  const featured = (products ?? []).slice(0, 8);
  const categories = Array.from(new Set((products ?? []).map((p) => p.category)));

  return (
    <div>
      <section className="relative overflow-hidden deep-panel">
        <img
          src={heroImage}
          alt="Assorted quality auto spare parts on a workshop bench"
          width={1600}
          height={912}
          className="absolute inset-0 size-full object-cover opacity-35"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-soft">
            Nationwide delivery in Nigeria
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
            The right spare part for your car, every time.
          </h1>
          <p className="mt-4 max-w-xl text-sm opacity-85 sm:text-base">
            Marketland Global supplies genuine and quality auto spare parts — brakes, filters,
            electrical, suspension and body lights — at honest prices.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/shop">Shop spare parts</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-white/30 bg-transparent hover:bg-white/10"
            >
              <Link to="/support">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Verified quality", text: "Tested parts you can trust." },
          { icon: Truck, title: "Fast delivery", text: "Delivered to all 36 states." },
          { icon: Headphones, title: "Real support", text: "Call or email us anytime." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3 p-4 surface-card">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold">Shop by category</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button key={c} variant="secondary" size="sm" asChild>
                <Link to="/shop" search={{ category: c }}>
                  {c}
                </Link>
              </Button>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold">Latest parts</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/shop">View all</Link>
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
              ))
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!isLoading && featured.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            No products yet. The store admin can add products from the Admin panel.
          </p>
        )}
      </section>
    </div>
  );
}
