"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useInactivityLogout } from "@/lib/useInactivityLogout";

export default function OrderProcessorDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useInactivityLogout("/order-processor/login");

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/order-processor/login"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const hasRole = (roles ?? []).some(r => r.role === "order_processor");
      if (!hasRole) { router.replace("/order-processor/login?denied=order_processor"); return; }
      if (active) setChecked(true);
    };
    check();
    return () => { active = false; };
  }, [router]);

  if (!checked) return null;

  return <>{children}</>;
}
