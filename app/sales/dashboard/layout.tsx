"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useInactivityLogout } from "@/lib/useInactivityLogout";

export default function SalesDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useInactivityLogout("/sales/login");

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/sales/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "sales") { router.replace("/sales/login"); return; }
      if (active) setChecked(true);
    };
    check();
    return () => { active = false; };
  }, [router]);

  if (!checked) return null;

  return <>{children}</>;
}

