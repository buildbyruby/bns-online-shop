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
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "order_processor") { router.replace("/order-processor/login"); return; }
      if (active) setChecked(true);
    };
    check();
    return () => { active = false; };
  }, [router]);

  if (!checked) return null;

  return <>{children}</>;
}

