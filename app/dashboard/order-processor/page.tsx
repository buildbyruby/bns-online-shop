"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, DollarSign, Users, TrendingUp } from "lucide-react";

type StaffMember = {
  id: string;
  full_name: string;
  is_active: boolean;
  total_sales?: number;
};

type Sale = {
  id: string;
  total_amount: number;
  created_at: string;
  salesperson_id: string;
  profiles?: { full_name: string };
};

export default function OrderProcessorDashboard() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch sales staff
      const { data: staffData } = await supabase
        .from("profiles")
        .select("id, full_name, is_active")
        .eq("role", "sales");

      // Fetch recent sales with salesperson info
      const { data: salesData } = await supabase
        .from("sales")
        .select("id, total_amount, created_at, salesperson_id, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(20);

      const total = salesData?.reduce((acc, s) => acc + Number(s.total_amount), 0) || 0;

      setStaff(staffData || []);
      setSales((salesData as any) || []);
      setTotalRevenue(total);
      setLoading(false);
    };
    fetchData();
  }, []);

  const activeCount = staff.filter(s => s.is_active).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-xs font-mono text-white/30 uppercase tracking-widest">Order Processor</h2>
        <h1 className="text-4xl font-light tracking-tight mt-1">Operations Overview</h1>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard icon={DollarSign} label="Total Revenue" value={`KSH ${totalRevenue.toLocaleString()}`} />
        <KPICard icon={Users} label="Active Staff" value={`${activeCount} / ${staff.length}`} />
        <KPICard icon={Activity} label="Recent Sales" value={sales.length.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staff Activity */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-light mb-6 flex items-center gap-2">
            <Users size={18} className="text-white/40" /> Staff Activity
          </h3>
          {loading ? (
            <p className="text-white/30 text-sm">Loading...</p>
          ) : staff.length === 0 ? (
            <p className="text-white/30 text-sm italic">No sales staff found.</p>
          ) : (
            <div className="space-y-3">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                      {member.full_name?.charAt(0)}
                    </div>
                    <span className="text-sm">{member.full_name}</span>
                  </div>
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                    member.is_active
                      ? "bg-green-500/10 text-green-400"
                      : "bg-white/5 text-white/30"
                  }`}>
                    {member.is_active ? "ACTIVE" : "OFFLINE"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-light mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-white/40" /> Recent Sales
          </h3>
          {loading ? (
            <p className="text-white/30 text-sm">Loading...</p>
          ) : sales.length === 0 ? (
            <p className="text-white/30 text-sm italic">No sales recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-3 border-b border-white/5">
                  <div>
                    <p className="text-sm">{(sale.profiles as any)?.full_name || "Unknown"}</p>
                    <p className="text-xs text-white/30 font-mono">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-mono text-sm">KSH {Number(sale.total_amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass-card p-8 group">
      <div className="p-2 bg-white/5 w-fit rounded-lg mb-4 group-hover:bg-white group-hover:text-black transition-all">
        <Icon size={22} strokeWidth={1} />
      </div>
      <p className="text-sm text-white/40 font-light">{label}</p>
      <p className="text-3xl font-light tracking-tighter mt-1">{value}</p>
    </div>
  );
}
