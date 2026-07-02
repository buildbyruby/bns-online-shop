import { supabase } from "@/lib/supabase/client";

// Re-exported for backward compatibility with existing `import { supabase } from "@/lib/supabase"`
// call sites. The underlying client now stores sessions in cookies (via @supabase/ssr) instead of
// localStorage, which is what allows proxy.ts to verify auth server-side before a page renders.
export { supabase };

export type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "sales" | "order_processor";
  is_active: boolean;
};

export type Customer = {
  id: string;
  type: "B2B" | "B2C";
  customer_name?: string;
  business_name?: string;
  contact_person?: string;
  phone: string;
  address?: string;
  preferences: any[];
  created_by: string;
};

