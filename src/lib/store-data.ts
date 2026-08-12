import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  image_urls?: string[] | null;
  category: string;
  brand: string | null;
  is_available: boolean;
  stock_quantity: number;
  created_at: string;
};

export type StoreSettings = {
  id: string;
  store_name: string;
  store_info: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  support_phone: string;
  support_email: string;
  whatsapp: string | null;
  address: string | null;
};

export type PublicStoreSettings = Omit<
  StoreSettings,
  "bank_name" | "account_name" | "account_number"
>;

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
});

const PUBLIC_SETTINGS_COLUMNS =
  "id,store_name,store_info,support_phone,support_email,whatsapp,address";

/** Public store info. Bank details are intentionally excluded (readable only when signed in). */
export const settingsQuery = queryOptions({
  queryKey: ["store_settings"],
  queryFn: async (): Promise<PublicStoreSettings | null> => {
    const { data, error } = await supabase
      .from("store_settings")
      .select(PUBLIC_SETTINGS_COLUMNS)
      .eq("id", "main")
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as PublicStoreSettings | null;
  },
});

/** Full store settings including bank/payment details. Requires an authenticated session. */
export const settingsFullQuery = queryOptions({
  queryKey: ["store_settings", "full"],
  queryFn: async (): Promise<StoreSettings | null> => {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", "main")
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as StoreSettings | null;
  },
});

export function productQuery(id: string) {
  return queryOptions({
    queryKey: ["product", id],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Product | null;
    },
  });
}
