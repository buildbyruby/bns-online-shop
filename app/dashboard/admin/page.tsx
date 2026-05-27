"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, DollarSign, TrendingUp, Activity, Package } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    customerCount: 0,
    activeStaff: 0,
  });

  useEffect(() => {
    // Basic real-time fetch logic
    const fetchData = async () => {
      const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { data: salesData } = await supabase.from('sales').select('total_amount');
      
      const total = salesData?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
      
      setStats({
        totalSales: total,
        customerCount: custCount || 0,
        activeStaff: 4, // Mocked for now until auth logic is fully linked
      });
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 space-y-8 animate-slide-up">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-sm font-mono text-muted uppercase tracking-widest">Executive Overview</h2>
          <h1 className="text-4xl font-light tracking-tight">System Performance</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Last Updated</p>
          <p className="font-mono text-sm">JUST NOW</p>
        </div>
      </header>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={DollarSign} label="Revenue" value={`$${stats.totalSales.toLocaleString()}`} trend="+12.5%" />
        <StatCard icon={Users} label="Total Customers" value={stats.customerCount.toString()} trend="+3" />
        <StatCard icon={Activity} label="Active Salespeople" value={stats.activeStaff.toString()} trend="Live" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 min-h-[300px]">
          <h3 className="text-lg font-light mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-muted" /> Recent Sales Activity
          </h3>
          <div className="space-y-4">
            {/* Sales feed would map here */}
            <p className="text-muted text-sm italic">Scanning real-time transactions...</p>
          </div>
        </div>

        <div className="glass-card p-6 min-h-[300px]">
          <h3 className="text-lg font-light mb-6 flex items-center gap-2">
            <Package size={20} className="text-muted" /> Inventory Insights
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-sm">Bakery Items</span>
              <span className="font-mono text-xs text-green-400">OPTIMAL</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-sm">Beverages</span>
              <span className="font-mono text-xs text-yellow-500">REPLENISH SOON</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend }: any) {
  return (
    <div className="glass-card p-8 group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white group-hover:text-black transition-all">
          <Icon size={24} strokeWidth={1} />
        </div>
        <span className="text-xs font-mono text-muted">{trend}</span>
      </div>
      <p className="text-sm text-muted font-light">{label}</p>
      <p className="text-3xl font-light tracking-tighter mt-1">{value}</p>
    </div>
  );
}