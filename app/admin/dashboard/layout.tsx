"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useInactivityLogout } from "@/lib/useInactivityLogout";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useInactivityLogout("/admin/login");

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/admin/login"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const hasAdmin = (roles ?? []).some(r => r.role === "admin");
      if (!hasAdmin) { router.replace("/admin/login?denied=admin"); return; }
      if (active) setChecked(true);
    };
    check();
    return () => { active = false; };
  }, [router]);

  if (!checked) return null;

  return <>{children}</>;
}
