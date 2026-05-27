"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Home, Users, Package, MessageSquare, BarChart3,
  ClipboardList, LogOut, Activity
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      setRole(profile?.role || null);
    };
    getRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const adminLinks = [
    { href: "/dashboard/admin", icon: Home, label: "Home" },
    { href: "/dashboard/admin/staff", icon: Users, label: "Staff List" },
    { href: "/dashboard/admin/products", icon: Package, label: "Products" },
    { href: "/dashboard/admin/messages", icon: MessageSquare, label: "Messages" },
    { href: "/dashboard/admin/sales-info", icon: BarChart3, label: "Sales Info" },
  ];

  const salesLinks = [
    { href: "/dashboard/sales", icon: Home, label: "Home" },
    { href: "/dashboard/sales/customers", icon: Users, label: "My Customers" },
    { href: "/dashboard/sales/orders", icon: ClipboardList, label: "Orders" },
  ];

  const orderProcessorLinks = [
    { href: "/dashboard/order-processor", icon: Home, label: "Home" },
    { href: "/dashboard/order-processor/activity", icon: Activity, label: "Staff Activity" },
    { href: "/dashboard/order-processor/sales", icon: BarChart3, label: "Sales Tracker" },
    { href: "/dashboard/order-processor/orders", icon: ClipboardList, label: "Orders" },
  ];

  const links =
    role === "admin" ? adminLinks :
    role === "order_processor" ? orderProcessorLinks :
    salesLinks;

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-6 gap-2 fixed h-full">
        <div className="mb-8">
          <p className="text-xs font-mono text-white/30 uppercase tracking-widest">BNS.OS</p>
          <p className="text-xs text-white/20 mt-1 uppercase tracking-widest">
            {role === "admin" ? "Manage Team" : role === "order_processor" ? "Order Control" : "Sales View"}
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                pathname === href
                  ? "bg-white text-black font-medium"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/30 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
