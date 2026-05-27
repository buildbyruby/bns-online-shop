"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Home, ClipboardList, BarChart3, Users, LogOut, Search, RefreshCw, ChevronDown } from "lucide-react";

const TABS = [
  { id: "Home", icon: Home, label: "Overview" },
  { id: "Orders", icon: ClipboardList, label: "Orders" },
  { id: "Staff", icon: Users, label: "Staff" },
  { id: "Analytics", icon: BarChart3, label: "Analytics" },
];
const STATUS_OPTIONS = ["pending", "processing", "completed", "cancelled"];
const REGIONS = ["Buruburu Phase 5","Buruburu Phase 4","Buruburu Phase 3","Buruburu Phase 2","Buruburu Phase 1","Harambee","Outskirts"];

export default function OrderProcessorDashboard() {
  const [activeTab, setActiveTab] = useState("Home");
  const [orders, setOrders] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ordersRes, staffRes, custRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("sales_force").select("*").order("name"),
        supabase.from("customers").select("*").order("customer_name"),
      ]);

      const allOrders = ordersRes.data || [];
      const allStaff = staffRes.data || [];
      const allCustomers = custRes.data || [];

      // Manually join orders with customers and staff
      const enrichedOrders = allOrders.map(order => ({
        ...order,
        customer: allCustomers.find(c => c.id === order.customer_id) || null,
        salesperson: allStaff.find(s => s.id === order.salesperson_id) || null,
      }));

      setOrders(enrichedOrders);
      setStaff(allStaff);
      setCustomers(allCustomers);
    } catch (err) {
      console.error("Load error:", err);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setUpdatingOrder(null);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  const fmt = (n: number) => n >= 1000000 ? `KSH ${(n/1000000).toFixed(2)}M` : `KSH ${n.toLocaleString()}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-KE", { day:"numeric", month:"short", year:"2-digit" });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en-KE", { hour:"2-digit", minute:"2-digit" });

  const statusColor = (s: string) => {
    if (s === "completed") return "text-emerald-400 bg-emerald-500/10";
    if (s === "processing") return "text-blue-400 bg-blue-500/10";
    if (s === "cancelled") return "text-rose-400 bg-rose-500/10";
    return "text-amber-400 bg-amber-500/10";
  };

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      (o.order_ref || "").toLowerCase().includes(q) ||
      (o.customer?.customer_name || "").toLowerCase().includes(q) ||
      (o.salesperson?.name || "").toLowerCase().includes(q) ||
      (o.customer?.phone || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchRegion = regionFilter === "all" || o.salesperson?.region === regionFilter;
    return matchSearch && matchStatus && matchRegion;
  });

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const processingOrders = orders.filter(o => o.status === "processing").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const activeStaff = staff.filter(s => s.status === "active").length;
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  const staffWithStats = staff.map(s => ({
    ...s,
    myOrders: orders.filter(o => o.salesperson_id === s.id),
    totalRevenue: orders.filter(o => o.salesperson_id === s.id).reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    todayOrders: orders.filter(o => o.salesperson_id === s.id && new Date(o.created_at).toDateString() === new Date().toDateString()).length,
  }));

  const revenueByRegion = REGIONS.map(region => {
    const regionOrders = orders.filter(o => o.salesperson?.region === region);
    return { region, total: regionOrders.reduce((s,o) => s + Number(o.total_amount||0),0), count: regionOrders.length };
  }).filter(r => r.count > 0).sort((a,b) => b.total - a.total);

  const Sidebar = () => (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-72 bg-black/95 backdrop-blur-xl border-r border-white/5 flex flex-col
      transform transition-transform duration-300
      lg:relative lg:translate-x-0 lg:flex
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    `}>
      <div className="p-6 lg:p-8 pb-8 lg:pb-12 flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tighter italic uppercase">BNS<span className="text-zinc-600">.OS</span></h1>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1">Order Processor</p>
        </div>
        <button className="lg:hidden text-zinc-500 hover:text-white" onClick={() => setSidebarOpen(false)}>✕</button>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {TABS.map((item) => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === item.id ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white hover:bg-white/5"}`}>
            <item.icon size={18} /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 lg:p-8 border-t border-white/5">
        <button onClick={handleLogout} className="text-zinc-600 hover:text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );

  if (loading) return (
    <div className="flex h-screen bg-[#080808] text-white items-center justify-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 animate-pulse">Loading...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#080808] text-white font-sans overflow-hidden">
      <Sidebar />

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 lg:h-24 border-b border-white/5 flex items-center justify-between px-4 lg:px-12 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-zinc-500 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">{activeTab}</h2>
          </div>
          <button onClick={loadAll} className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-600 hover:text-white transition-colors">
            <RefreshCw size={14} /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-6 lg:space-y-8">

          {/* HOME */}
          {activeTab === "Home" && (
            <div className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                {[
                  { label: "Total Revenue", val: fmt(totalRevenue), sub: `${orders.length} orders` },
                  { label: "Today", val: fmt(todayRevenue), sub: `${todayOrders.length} today` },
                  { label: "Pending", val: pendingOrders, sub: `${processingOrders} processing` },
                  { label: "Active Staff", val: activeStaff, sub: `of ${staff.length} total` },
                ].map((m, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 p-5 lg:p-8 rounded-2xl lg:rounded-[2rem]">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 lg:mb-4">{m.label}</p>
                    <h3 className="text-xl lg:text-3xl font-black tracking-tighter italic">{m.val}</h3>
                    <p className="text-[9px] text-zinc-600 mt-1 lg:mt-2">{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* Pending orders needing action */}
              <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem]">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Needs Action</p>
                  <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">{pendingOrders} pending</span>
                </div>
                {orders.filter(o => o.status === "pending").length === 0 ? (
                  <p className="text-[9px] text-zinc-700 text-center py-8">No pending orders 🎉</p>
                ) : (
                  <div className="space-y-3">
                    {orders.filter(o => o.status === "pending").slice(0, 8).map(order => (
                      <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-5 bg-white/[0.02] rounded-2xl border border-white/5 gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase">{order.order_ref}</p>
                          <p className="text-[9px] text-zinc-500">{order.customer?.customer_name || "Unknown"} · {order.salesperson?.name || "Unknown"}</p>
                          <p className="text-[9px] text-zinc-600">{fmtDate(order.created_at)} {fmtTime(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-black text-emerald-400">{fmt(order.total_amount)}</p>
                          <button onClick={() => updateOrderStatus(order.id, "processing")} disabled={updatingOrder === order.id}
                            className="px-4 py-2 bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase rounded-xl hover:bg-blue-500/30 transition-all disabled:opacity-50 whitespace-nowrap">
                            {updatingOrder === order.id ? "..." : "Process →"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer summary */}
              <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem]">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Customers ({customers.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {customers.slice(0, 6).map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0">{(c.customer_name||"?")[0]}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase truncate">{c.customer_name}</p>
                        <p className="text-[9px] text-zinc-500 truncate">{c.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {customers.length > 6 && <p className="text-[9px] text-zinc-600 mt-3 text-center">+{customers.length - 6} more customers</p>}
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === "Orders" && (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 flex-1">
                  <Search size={14} className="text-zinc-500 flex-shrink-0" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search order, customer, staff..."
                    className="bg-transparent outline-none text-sm flex-1 min-w-0" />
                </div>
                <div className="flex gap-2">
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/5 rounded-2xl px-3 py-3 text-[10px] font-black uppercase outline-none flex-1 sm:flex-none">
                    <option value="all" className="bg-black">All Status</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                  </select>
                  <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
                    className="bg-white/5 border border-white/5 rounded-2xl px-3 py-3 text-[10px] font-black uppercase outline-none flex-1 sm:flex-none">
                    <option value="all" className="bg-black">All Regions</option>
                    {REGIONS.map(r => <option key={r} value={r} className="bg-black">{r}</option>)}
                  </select>
                </div>
              </div>

              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{filteredOrders.length} orders</p>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-16"><p className="text-[10px] font-black text-zinc-700 uppercase">No orders found</p></div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-2xl lg:rounded-3xl p-5 lg:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-sm font-black uppercase">{order.order_ref}</p>
                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${statusColor(order.status)}`}>{order.status}</span>
                          </div>
                          <p className="text-[10px] text-zinc-500">👤 {order.customer?.customer_name || "Unknown"} · {order.customer?.phone || ""}</p>
                          <p className="text-[10px] text-zinc-500">🧑‍💼 {order.salesperson?.name || "Unknown"} · {order.salesperson?.region || ""}</p>
                          <p className="text-[9px] text-zinc-600 mt-1">{fmtDate(order.created_at)} at {fmtTime(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-black text-emerald-400 text-lg">{fmt(order.total_amount)}</p>
                          <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)}
                            disabled={updatingOrder === order.id}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[9px] font-black uppercase outline-none disabled:opacity-50">
                            {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-3 space-y-1">
                        {(order.items || []).map((item: any, i: number) => (
                          <p key={i} className="text-[9px] text-zinc-500">• {item.name} × {item.quantity} — KSH {(item.subtotal || item.price * item.quantity).toLocaleString()}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STAFF */}
          {activeTab === "Staff" && (
            <div className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-3 gap-3 lg:gap-6">
                {[
                  { label: "Active", val: staff.filter(s => s.status === "active").length, color: "text-emerald-400" },
                  { label: "Suspended", val: staff.filter(s => s.status === "suspended").length, color: "text-amber-400" },
                  { label: "Total", val: staff.length, color: "text-white" },
                ].map((m, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 p-5 lg:p-8 rounded-2xl lg:rounded-[2rem]">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">{m.label}</p>
                    <h3 className={`text-2xl lg:text-4xl font-black italic ${m.color}`}>{m.val}</h3>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {staffWithStats.filter(s => s.status !== "removed").map(s => (
                  <div key={s.id} className={`bg-white/[0.02] border rounded-2xl lg:rounded-3xl p-5 lg:p-8 ${s.status === "suspended" ? "border-amber-500/20" : "border-white/5"}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white text-black rounded-xl lg:rounded-2xl flex items-center justify-center font-black italic">{s.name?.[0]}</div>
                        <div>
                          <h4 className="text-sm font-black uppercase">{s.name}</h4>
                          <p className="text-[9px] text-zinc-500">{s.region}</p>
                          <p className="text-[9px] text-zinc-600">{s.phone}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase ${s.status === "active" ? "text-emerald-400" : s.status === "suspended" ? "text-amber-500" : "text-rose-400"}`}>{s.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
                      <div><p className="text-[8px] text-zinc-600 uppercase mb-1">Orders</p><p className="font-black">{s.myOrders.length}</p></div>
                      <div><p className="text-[8px] text-zinc-600 uppercase mb-1">Today</p><p className="font-black text-blue-400">{s.todayOrders}</p></div>
                      <div><p className="text-[8px] text-zinc-600 uppercase mb-1">Revenue</p><p className="font-black text-emerald-400 text-xs">{fmt(s.totalRevenue)}</p></div>
                    </div>
                    {s.myOrders.slice(0,3).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                        <p className="text-[8px] text-zinc-600 uppercase font-black">Recent</p>
                        {s.myOrders.slice(0,3).map((o: any) => (
                          <div key={o.id} className="flex justify-between items-center">
                            <p className="text-[9px] text-zinc-500">{fmtDate(o.created_at)}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${statusColor(o.status)}`}>{o.status}</span>
                              <p className="text-[9px] font-black text-emerald-400">KSH {Number(o.total_amount).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === "Analytics" && (
            <div className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                {[
                  { label: "Total Orders", val: orders.length },
                  { label: "Completed", val: completedOrders },
                  { label: "Processing", val: processingOrders },
                  { label: "Pending", val: pendingOrders },
                ].map((m, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 p-5 lg:p-8 rounded-2xl lg:rounded-[2rem]">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 lg:mb-4">{m.label}</p>
                    <h3 className="text-2xl lg:text-4xl font-black tracking-tighter italic">{m.val}</h3>
                  </div>
                ))}
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem]">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-6 lg:mb-8">Revenue by Region</p>
                {revenueByRegion.length === 0 ? (
                  <p className="text-[9px] text-zinc-700 text-center py-8">No data yet</p>
                ) : revenueByRegion.map((r, i) => {
                  const max = Math.max(...revenueByRegion.map(x => x.total), 1);
                  return (
                    <div key={r.region} className="mb-5">
                      <div className="flex justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <span className="text-[9px] font-black text-zinc-600 w-4">#{i+1}</span>
                          <span className="text-[10px] font-black uppercase">{r.region}</span>
                          <span className="text-[9px] text-zinc-600">{r.count} orders</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-400">{fmt(r.total)}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.round((r.total/max)*100)}%`}}/>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem]">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-6 lg:mb-8">Staff Leaderboard</p>
                {[...staffWithStats].filter(s => s.status !== "removed").sort((a,b) => b.totalRevenue - a.totalRevenue).map((s, i) => {
                  const max = Math.max(...staffWithStats.map(x => x.totalRevenue), 1);
                  return (
                    <div key={s.id} className="mb-5">
                      <div className="flex justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <span className="text-[9px] font-black text-zinc-600 w-4">#{i+1}</span>
                          <span className="text-[10px] font-black uppercase">{s.name}</span>
                          <span className="text-[9px] text-zinc-600 hidden sm:inline">{s.region}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${s.status === "suspended" ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"}`}>{s.status}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-400">{fmt(s.totalRevenue)}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.round((s.totalRevenue/max)*100)}%`}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
