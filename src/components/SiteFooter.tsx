import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone } from "lucide-react";

import { settingsQuery } from "@/lib/store-data";
import brandMark from "@/assets/marketland-mark.png.asset.json";

export function SiteFooter() {
  const { data: settings } = useQuery(settingsQuery);

  return (
    <footer className="mt-16 deep-panel">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white">
              <img src={brandMark.url} alt="MarketLand logo" width={30} height={30} className="size-7" />
            </span>
            <h3 className="text-lg font-bold">{settings?.store_name ?? "Marketland Global"}</h3>
          </div>
          <p className="mt-2 max-w-sm text-sm opacity-80">
            {settings?.store_info ?? "Quality auto spare parts across Nigeria."}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide opacity-70">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm opacity-90">
            <li>
              <Link to="/shop">All spare parts</Link>
            </li>
            <li>
              <Link to="/cart">My cart</Link>
            </li>
            <li>
              <Link to="/orders">Order status</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide opacity-70">Customer service</h4>
          <ul className="mt-3 space-y-2 text-sm opacity-90">
            {settings?.support_phone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <a href={`tel:${settings.support_phone}`}>{settings.support_phone}</a>
              </li>
            )}
            {settings?.support_email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" />
                <a href={`mailto:${settings.support_email}`} className="truncate">
                  {settings.support_email}
                </a>
              </li>
            )}
            {settings?.address && (
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" />
                {settings.address}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} {settings?.store_name ?? "Marketland Global"}. All rights
        reserved.
      </div>
    </footer>
  );
}
