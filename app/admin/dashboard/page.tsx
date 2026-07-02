"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Home, Users, MessageSquare, BarChart3, LogOut, X, Zap, Send, Edit3, Radio, AlertTriangle, Trash2, PauseCircle, PlayCircle, Package, Plus } from "lucide-react";

const REGIONS = ["Buruburu Phase 5","Buruburu Phase 4","Buruburu Phase 3","Buruburu Phase 2","Buruburu Phase 1","Harambee","Outskirts"];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Home");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [orderProcessorList, setOrderProcessorList] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", phone: "", area: "Buruburu Phase 1" });
  const [productForm, setProductForm] = useState({ id: "", name: "", purchase_price: "", selling_price: "", stock: "", category_id: "", image_url: "", product_type: "B2C" });
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [totalMoney, setTotalMoney] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dmTarget, setDmTarget] = useState<any>(null);
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [newDmMsg, setNewDmMsg] = useState("");
  const bottomRef = useRef<any>(null);
  const dmBottomRef = useRef<any>(null);
  const router = useRouter();

  const purchasePrice = Number(productForm.purchase_price) || 0;
  const sellingPrice = Number(productForm.selling_price) || 0;
  const profitAmount = sellingPrice - purchasePrice;
  const profitMargin = sellingPrice > 0 ? ((profitAmount / sellingPrice) * 100).toFixed(1) : "0.0";

  useEffect(() => { loadAll(); loadGroupMessages(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeTab !== "Chat") return;
    // Subscribe to ALL group messages in real time
    const sub = supabase.channel("admin-group-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "receiver_id=eq.ALL" },
        (p: any) => setMessages(prev => [...prev, p.new]))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeTab]);

  useEffect(() => {
    dmBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMessages]);

  useEffect(() => {
    if (!dmTarget) return;
    loadDmMessages(dmTarget.id);
    const sub = supabase.channel(`dm-admin-${dmTarget.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (p: any) => {
          const m = p.new;
          if ((m.sender_id === "ADMIN" && m.receiver_id === dmTarget.id) ||
              (m.sender_id === dmTarget.id && m.receiver_id === "ADMIN")) {
            setDmMessages(prev => [...prev, m]);
          }
        }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [dmTarget]);

    const loadAll = async () => {
    const [staffRes, ordersRes, custRes, prodRes, catRes, adminsRes, opRes] = await Promise.all([
      supabase.from("sales_force").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("salesperson_id, total_amount"),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("products").select("*, categories(name)").order("name"),
      supabase.from("categories").select("*").order("name"),
      supabase.from("admins").select("*").order("created_at", { ascending: false }),
      supabase.from("order_processors").select("*").order("created_at", { ascending: false })
    ]);
    const allOrders = ordersRes.data || [];
    if (staffRes.data) {
      setStaffList(staffRes.data.map((s: any) => ({
        ...s,
        order_total: allOrders.filter((o: any) => o.salesperson_id === s.id).reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0)
      })));
    }
    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (adminsRes.data) setAdminList(adminsRes.data);
    if (opRes.data) setOrderProcessorList(opRes.data);
    setTotalMoney(allOrders.reduce((s: number, r: any) => s + (Number(r.total_amount) || 0), 0));
    setTotalCustomers(custRes.count || 0);
  };

  const loadGroupMessages = async () => {
    const { data } = await supabase.from("messages").select("*").eq("receiver_id", "ALL").order("created_at");
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    const msg = { sender_id: "ADMIN", receiver_id: "ALL", content: newMsg.trim(), is_admin_sender: true };
    const { data } = await supabase.from("messages").insert([msg]).select().single();
    if (data) setMessages(prev => [...prev, data]);
    setNewMsg("");
  };

  const loadDmMessages = async (staffId: string) => {
    const { data } = await supabase.from("messages").select("*")
      .or(`and(sender_id.eq.ADMIN,receiver_id.eq.${staffId}),and(sender_id.eq.${staffId},receiver_id.eq.ADMIN)`)
      .order("created_at");
    if (data) setDmMessages(data);
  };

  const sendDmMessage = async () => {
    if (!newDmMsg.trim() || !dmTarget) return;
    const msg = { sender_id: "ADMIN", receiver_id: dmTarget.id, content: newDmMsg.trim(), is_admin_sender: true };
    const { data } = await supabase.from("messages").insert([msg]).select().single();
    if (data) setDmMessages(prev => [...prev, data]);
    setNewDmMsg("");
  };

    const handleSuspend = async (staff: any) => {
    await supabase.from("sales_force").update({ status: staff.status === "suspended" ? "active" : "suspended" }).eq("id", staff.id);
    await loadAll(); setShowConfirm(null);
  };

  const handleRemove = async (staff: any) => {
    await supabase.from("sales_force").update({ status: "removed" }).eq("id", staff.id);
    await loadAll(); setShowConfirm(null);
  };

  const handleSaveStaff = async (e: any) => {
    e.preventDefault(); setSaving(true);
    if (isEditing) { await supabase.from("sales_force").update({ name: formData.name, phone: formData.phone, region: formData.area }).eq("id", formData.id); }
    else { await supabase.from("sales_force").insert([{ name: formData.name, phone: formData.phone, region: formData.area, status: "active" }]); }
    await loadAll(); setShowModal(false); setSaving(false);
  };

  const handleSaveProduct = async (e: any) => {
    e.preventDefault(); setSaving(true);
    const payload = { name: productForm.name, price: Number(productForm.selling_price), purchase_price: Number(productForm.purchase_price), stock_quantity: Number(productForm.stock), category_id: productForm.category_id || null, image_url: productForm.image_url || null, product_type: productForm.product_type };
    if (productForm.id) { await supabase.from("products").update(payload).eq("id", productForm.id); }
    else { await supabase.from("products").insert([payload]); }
    await loadAll(); setShowProductModal(false); setSaving(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    await loadAll();
  };

  const openEditProduct = (p: any) => {
    setProductForm({ id: p.id, name: p.name, purchase_price: String(p.purchase_price || ""), selling_price: String(p.price || ""), stock: String(p.stock_quantity || ""), category_id: p.category_id || "", image_url: p.image_url || "", product_type: p.product_type || "B2C" });
    setShowProductModal(true);
  };

  const fmt = (n: number) => n >= 1000000 ? `KSH ${(n/1000000).toFixed(2)}M` : `KSH ${n.toLocaleString()}`;
  const activeStaff = staffList.filter(s => s.status === "active");
  const performance = staffList.length > 0 ? Math.round((staffList.filter(s => (s.total_sales||0) > 0).length / staffList.length) * 100) : 0;
  const statusColor = (s: string) => s === "suspended" ? "text-amber-500" : s === "removed" ? "text-rose-500" : "text-emerald-400";

  const getSenderName = (m: any) => {
    if (m.is_admin_sender) return "Admin";
    const staff = staffList.find(s => s.id === m.sender_id);
    return staff?.name || "Staff";
  };

  return (
    <div className="flex h-screen bg-[#080808] text-white font-sans overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-black/95 backdrop-blur-xl border-r border-white/5 flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 lg:p-8 pb-8 flex items-start justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tighter italic uppercase">BNS<span className="text-zinc-400">.OS</span></h1>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-1">Manage Team</p>
          </div>
          <button className="lg:hidden text-zinc-400 hover:text-white mt-1" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: "Home", icon: Home, label: "Home" },
            { id: "Staff", icon: Users, label: "Staff List" },
            { id: "Admins", icon: Users, label: "Admin List" },
            { id: "OrderProcessors", icon: Users, label: "Order Processors" },
            { id: "Products", icon: Package, label: "Products" },
            { id: "Chat", icon: MessageSquare, label: "Messages" },
            { id: "Stats", icon: BarChart3, label: "Sales Info" }
          ].map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === item.id ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 lg:p-8 border-t border-white/5">
          <button onClick={() => router.push("/")} className="text-zinc-400 hover:text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><LogOut size={18} /> Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="h-16 lg:h-24 border-b border-white/5 flex items-center justify-between px-4 lg:px-12 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "Products" ? (
              <button onClick={() => { setProductForm({id:"",name:"",purchase_price:"",selling_price:"",stock:"",category_id:"",image_url:"",product_type:"B2C"}); setShowProductModal(true); }}
                className="bg-white text-black px-4 lg:px-6 py-2 lg:py-3 rounded-full text-[10px] font-black uppercase tracking-tighter hover:scale-105 transition-transform flex items-center gap-2">
                <Plus size={14} /> Add Product
              </button>
            ) : activeTab !== "Chat" ? (
              <button onClick={() => { setIsEditing(false); setFormData({id:"",name:"",phone:"",area:"Buruburu Phase 1"}); setShowModal(true); }}
                className="bg-white text-black px-4 lg:px-6 py-2 lg:py-3 rounded-full text-[10px] font-black uppercase tracking-tighter hover:scale-105 transition-transform flex items-center gap-2">
                <Zap size={14} fill="black" /> Add Staff
              </button>
            ) : null}
          </div>
        </header>

        <div className={`flex-1 overflow-hidden ${activeTab !== "Chat" ? "overflow-y-auto p-4 lg:p-12" : ""}`}>

          {activeTab === "Home" && (
            <div className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                {[{ label: "Total Revenue", val: fmt(totalMoney) }, { label: "Active Staff", val: activeStaff.length }, { label: "Total Customers", val: totalCustomers.toLocaleString() }, { label: "Performance", val: `${performance}%` }].map((m, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 p-5 lg:p-8 rounded-2xl lg:rounded-[2rem]">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 lg:mb-4">{m.label}</p>
                    <h3 className="text-2xl lg:text-3xl font-black tracking-tighter italic">{m.val}</h3>
                  </div>
                ))}
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem]">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-6">Staff Overview</p>
                <div className="space-y-3">
                  {staffList.filter(s => s.status !== "removed").slice(0, 6).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 lg:p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-8 h-8 lg:w-9 lg:h-9 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">{s.name?.[0]}</div>
                        <div><p className="text-[11px] font-black uppercase">{s.name}</p><p className="text-[9px] text-zinc-400">{s.region}</p></div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-400">{fmt(s.order_total || 0)}</p>
                        <p className={`text-[9px] uppercase font-black ${statusColor(s.status)}`}>{s.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Staff" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {staffList.filter(s => s.status !== "removed").map((s) => (
                <div key={s.id} className={`bg-white/[0.02] border rounded-3xl p-6 lg:p-8 ${s.status === "suspended" ? "border-amber-500/20" : "border-white/5"}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center font-black italic text-lg">{s.name?.[0]}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setFormData({id:s.id,name:s.name,phone:s.phone,area:s.region}); setIsEditing(true); setShowModal(true); }} className="p-2 bg-white/5 rounded-xl hover:bg-white hover:text-black transition-all"><Edit3 size={14}/></button>
                      <button onClick={() => setShowConfirm({ type: "suspend", staff: s })} className={`p-2 rounded-xl transition-all ${s.status === "suspended" ? "bg-amber-500/20 text-amber-500" : "bg-white/5 hover:bg-amber-500/20 hover:text-amber-500"}`}>{s.status === "suspended" ? <PlayCircle size={14}/> : <PauseCircle size={14}/>}</button>
                      <button onClick={() => setShowConfirm({ type: "remove", staff: s })} className="p-2 bg-white/5 rounded-xl hover:bg-rose-500/20 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <h4 className="text-sm font-black uppercase">{s.name}</h4>
                  <div className="mt-3 space-y-1 text-[10px] text-zinc-400 font-bold uppercase"><p>{s.region}</p><p>{s.phone}</p><p>Last login: {s.last_login ? new Date(s.last_login).toLocaleString() : "Never"}</p></div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className={`text-[9px] font-black uppercase ${statusColor(s.status)}`}>{s.status}</span>
                    <span className="text-[10px] font-black text-emerald-400">{fmt(s.order_total || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Admins" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {adminList.map((a) => (
                <div key={a.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 lg:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center font-black italic text-lg">{a.name?.[0]?.toUpperCase()}</div>
                  </div>
                  <h4 className="text-sm font-black uppercase">{a.name || "—"}</h4>
                  <div className="mt-3 space-y-1 text-[10px] text-zinc-400 font-bold uppercase">
                    <p>{a.email}</p>
                    <p>{a.phone || ""}</p>
                    <p>Last login: {a.last_login ? new Date(a.last_login).toLocaleString() : "Never"}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-emerald-400">Active</span>
                    <span className="text-[9px] font-black uppercase text-zinc-400">Admin</span>
                  </div>
                </div>
              ))}
              {adminList.length === 0 && <p className="text-[10px] text-zinc-400 font-bold uppercase">No admins found</p>}
            </div>
          )}

          {activeTab === "OrderProcessors" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {orderProcessorList.map((op) => (
                <div key={op.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 lg:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center font-black italic text-lg">{op.name?.[0]?.toUpperCase()}</div>
                  </div>
                  <h4 className="text-sm font-black uppercase">{op.name || "—"}</h4>
                  <div className="mt-3 space-y-1 text-[10px] text-zinc-400 font-bold uppercase">
                    <p>{op.email}</p>
                    <p>{op.phone || ""}</p>
                    <p>Last login: {op.last_login ? new Date(op.last_login).toLocaleString() : "Never"}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-emerald-400">Active</span>
                    <span className="text-[9px] font-black uppercase text-zinc-400">Order Processor</span>
                  </div>
                </div>
              ))}
              {orderProcessorList.length === 0 && <p className="text-[10px] text-zinc-400 font-bold uppercase">No order processors found</p>}
            </div>
          )}

          {activeTab === "Products" && (
            <div className="space-y-6">
              {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24">
                  <Package size={40} className="text-zinc-800 mb-4" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No products yet</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {products.map((p) => {
                  const pp = Number(p.purchase_price || 0);
                  const sp = Number(p.price || 0);
                  const profit = sp - pp;
                  const margin = sp > 0 ? ((profit / sp) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={p.id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" /> : <div className="w-full h-40 bg-white/5 flex items-center justify-center"><Package size={32} className="text-zinc-400" /></div>}
                      <div className="p-5 lg:p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-black uppercase">{p.name}</h4>
                          {p.product_type && <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${p.product_type === "B2B" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>{p.product_type}</span>}
                        </div>
                        {p.categories?.name && <p className="text-[9px] text-zinc-400 uppercase mb-2">{p.categories.name}</p>}
                        {pp > 0 && <p className="text-[9px] text-zinc-400">Buy: KSH {pp.toLocaleString()}</p>}
                        <p className="text-emerald-400 font-black text-xl">KSH {sp.toLocaleString()}</p>
                        {pp > 0 && <p className={`text-[9px] font-black mt-1 ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>Profit: KSH {profit.toLocaleString()} ({margin}%)</p>}
                        <p className="text-[9px] text-zinc-400 mb-4">{p.stock_quantity} in stock</p>
                        <div className="flex gap-2">
                          <button onClick={() => openEditProduct(p)} className="flex-1 p-3 bg-white/5 rounded-xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all">Edit</button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-3 bg-white/5 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 transition-all"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "Chat" && (
            <div className="h-full flex overflow-hidden">
              {/* Contact list sidebar */}
              <div className="w-44 lg:w-52 border-r border-white/5 flex flex-col overflow-y-auto flex-shrink-0">
                <button onClick={() => setDmTarget(null)}
                  className={`p-4 text-left border-b border-white/5 transition-all ${!dmTarget ? "bg-white/10" : "hover:bg-white/5"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                    <span className="text-[10px] font-black uppercase">Group</span>
                  </div>
                  <p className="text-[8px] text-zinc-400 pl-4">{activeStaff.length} staff</p>
                </button>
                {staffList.filter(s => s.status !== "removed").map(s => (
                  <button key={s.id} onClick={() => setDmTarget(s)}
                    className={`p-4 text-left border-b border-white/5 transition-all w-full ${dmTarget?.id === s.id ? "bg-white/10" : "hover:bg-white/5"}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0">{s.name?.[0]}</div>
                      <div className="min-w-0 text-left">
                        <p className="text-[10px] font-black uppercase truncate">{s.name?.split(" ")[0]}</p>
                        <p className={`text-[8px] font-black uppercase ${s.status === "active" ? "text-emerald-400" : "text-amber-500"}`}>{s.status}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Chat area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
                  {dmTarget ? (
                    <>
                      <div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">{dmTarget.name?.[0]}</div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">{dmTarget.name}</p>
                        <p className="text-[8px] text-zinc-400">Direct message — only you and {dmTarget.name?.split(" ")[0]} see this</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Team Group Chat</p>
                      <span className="text-[9px] text-zinc-400 bg-white/5 px-2 py-1 rounded-full ml-2">{activeStaff.length} staff</span>
                      <span className="text-[9px] text-zinc-400 ml-auto hidden lg:block">Everyone sees all messages</span>
                    </>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                  {dmTarget ? (
                    <>
                      {dmMessages.length === 0 && <p className="text-center text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-12">No messages yet — say hi to {dmTarget.name?.split(" ")[0]}</p>}
                      {dmMessages.map((m, i) => {
                        const isAdmin = m.is_admin_sender;
                        return (
                          <div key={i} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                            <p className="text-[8px] font-black text-zinc-400 uppercase mb-1 px-1">{isAdmin ? "Admin" : dmTarget.name}</p>
                            <div className={`max-w-xs lg:max-w-md px-4 lg:px-5 py-3 rounded-2xl text-xs font-medium ${isAdmin ? "bg-white text-black" : "bg-white/5 border border-white/10 text-white"}`}>
                              {m.content}
                            </div>
                            <p className="text-[8px] text-zinc-400 px-1 mt-0.5">{new Date(m.created_at).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p>
                          </div>
                        );
                      })}
                      <div ref={dmBottomRef} />
                    </>
                  ) : (
                    <>
                      {messages.length === 0 && <p className="text-center text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-12">No messages yet — start the conversation</p>}
                      {messages.map((m, i) => {
                        const isAdmin = m.is_admin_sender;
                        const senderName = getSenderName(m);
                        return (
                          <div key={i} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                            <p className="text-[8px] font-black text-zinc-400 uppercase mb-1 px-1">{senderName}</p>
                            <div className={`max-w-xs lg:max-w-md px-4 lg:px-5 py-3 rounded-2xl text-xs font-medium ${isAdmin ? "bg-white text-black" : "bg-white/5 border border-white/10 text-white"}`}>
                              {m.content}
                            </div>
                            <p className="text-[8px] text-zinc-400 px-1 mt-0.5">{new Date(m.created_at).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </>
                  )}
                </div>

                <div className="p-4 lg:p-6 border-t border-white/5 flex-shrink-0">
                  {dmTarget ? (
                    <div className="flex items-center gap-3 lg:gap-4 bg-white/5 p-2 lg:p-3 rounded-2xl border border-white/5">
                      <input value={newDmMsg} onChange={e => setNewDmMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendDmMessage()} placeholder={`Message ${dmTarget.name?.split(" ")[0]}...`} className="bg-transparent flex-1 outline-none text-sm px-3 lg:px-4" />
                      <button onClick={sendDmMessage} className="p-2 lg:p-3 bg-white text-black rounded-xl hover:scale-105 transition-transform flex-shrink-0"><Send size={16}/></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 lg:gap-4 bg-white/5 p-2 lg:p-3 rounded-2xl border border-white/5">
                        <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Send a message to the whole team..." className="bg-transparent flex-1 outline-none text-sm px-3 lg:px-4" />
                        <button onClick={sendMessage} className="p-2 lg:p-3 bg-white text-black rounded-xl hover:scale-105 transition-transform flex-shrink-0"><Send size={16}/></button>
                      </div>
                      <p className="text-[8px] text-zinc-400 mt-2 px-1">All staff and admin see this group chat in real time</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}


          {activeTab === "Stats" && (
            <div className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white/[0.03] border border-white/5 p-6 lg:p-8 rounded-[2rem]"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Total Staff</p><h3 className="text-4xl font-black italic">{activeStaff.length}</h3></div>
                <div className="bg-white/[0.03] border border-white/5 p-6 lg:p-8 rounded-[2rem]"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Total Revenue</p><h3 className="text-4xl font-black italic text-emerald-400">{fmt(totalMoney)}</h3></div>
                <div className="bg-white/[0.03] border border-white/5 p-6 lg:p-8 rounded-[2rem]"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Active Regions</p><h3 className="text-4xl font-black italic">{[...new Set(activeStaff.map(s => s.region))].length}</h3></div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-10 rounded-[3rem]">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-8">Leaderboard</p>
                <div className="space-y-5">
                  {[...staffList].filter(s => s.status !== "removed").sort((a,b) => (b.order_total||0)-(a.order_total||0)).map((s,i) => {
                    const max = Math.max(...staffList.map((x: any) => x.order_total||0), 1);
                    return (
                      <div key={s.id}>
                        <div className="flex justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-zinc-400 w-4">#{i+1}</span>
                            <span className="text-[10px] font-black uppercase">{s.name}</span>
                            <span className="text-[9px] text-zinc-400 hidden sm:inline">{s.region}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${s.status === "suspended" ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"}`}>{s.status}</span>
                          </div>
                          <span className="text-[10px] font-black text-emerald-400">{fmt(s.order_total||0)}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.round(((s.order_total||0)/max)*100)}%`}}/></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-sm p-8 lg:p-10 rounded-[3rem]">
            <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black italic uppercase tracking-tighter">{isEditing?"Edit Staff":"Add Staff"}</h2><button onClick={() => setShowModal(false)}><X size={24}/></button></div>
            <form onSubmit={handleSaveStaff} className="space-y-6">
              <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold" value={formData.name} onChange={e => setFormData({...formData,name:e.target.value})} required placeholder="Full Name"/>
              <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold" value={formData.phone} onChange={e => setFormData({...formData,phone:e.target.value})} required placeholder="Phone Number"/>
              <select className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold" value={formData.area} onChange={e => setFormData({...formData,area:e.target.value})}>
                {REGIONS.map(r => <option key={r} className="bg-black">{r}</option>)}
              </select>
              <button type="submit" disabled={saving} className="w-full bg-white text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50">{saving?"Saving...":isEditing?"Save Changes":"Add to Team"}</button>
            </form>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-md p-8 lg:p-10 rounded-[3rem] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black italic uppercase tracking-tighter">{productForm.id?"Edit Product":"Add Product"}</h2><button onClick={() => setShowProductModal(false)}><X size={24}/></button></div>
            <form onSubmit={handleSaveProduct} className="space-y-5">
              <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold" value={productForm.name} onChange={e => setProductForm({...productForm,name:e.target.value})} required placeholder="Product Name"/>
              <div>
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-3">Product Type</label>
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
                  {["B2C","B2B"].map(type => (
                    <button type="button" key={type} onClick={() => setProductForm({...productForm, product_type: type})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${productForm.product_type === type ? "bg-white text-black" : "text-zinc-400"}`}>
                      {type === "B2C" ? "B2C — Individual" : "B2B — Business"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-3">Pricing & Profit</label>
                <div className="space-y-3">
                  <input type="number" className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold" value={productForm.purchase_price} onChange={e => setProductForm({...productForm,purchase_price:e.target.value})} placeholder="Purchase Price (KSH)"/>
                  <input type="number" required className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold" value={productForm.selling_price} onChange={e => setProductForm({...productForm,selling_price:e.target.value})} placeholder="Selling Price (KSH)"/>
                  {purchasePrice > 0 && sellingPrice > 0 && (
                    <div className={`p-4 rounded-2xl border ${profitAmount >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}>
                      <div className="flex justify-between"><span className="text-[9px] font-black uppercase text-zinc-400">Profit</span><span className={`font-black ${profitAmount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>KSH {profitAmount.toLocaleString()}</span></div>
                      <div className="flex justify-between mt-1"><span className="text-[9px] font-black uppercase text-zinc-400">Margin</span><span className={`font-black ${profitAmount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{profitMargin}%</span></div>
                    </div>
                  )}
                </div>
              </div>
              <input type="number" className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold" value={productForm.stock} onChange={e => setProductForm({...productForm,stock:e.target.value})} required placeholder="Stock quantity"/>
              <select className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold" value={productForm.category_id} onChange={e => setProductForm({...productForm,category_id:e.target.value})}>
                <option value="" className="bg-black">— Category (optional) —</option>
                {categories.map(c => <option key={c.id} value={c.id} className="bg-black">{c.name}</option>)}
              </select>
              <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold" value={productForm.image_url} onChange={e => setProductForm({...productForm,image_url:e.target.value})} placeholder="Image URL (optional)"/>
              <button type="submit" disabled={saving} className="w-full bg-white text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50">{saving?"Saving...":productForm.id?"Update":"Add Product"}</button>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-sm p-8 lg:p-10 rounded-[3rem]">
            <div className="flex items-center gap-4 mb-6"><AlertTriangle size={28} className={showConfirm.type==="remove"?"text-rose-500":"text-amber-500"}/><div><h2 className="text-lg font-black italic uppercase">{showConfirm.type==="remove"?"Remove Staff":showConfirm.staff.status==="suspended"?"Reactivate":"Suspend"}</h2><p className="text-[9px] text-zinc-400 mt-1">{showConfirm.staff.name}</p></div></div>
            <p className="text-[11px] text-zinc-400 mb-8 leading-relaxed">{showConfirm.type==="remove"?"They will be removed from the team.":showConfirm.staff.status==="suspended"?"They will be able to log in again.":"They will be blocked from logging in."}</p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirm(null)} className="flex-1 border border-white/10 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-white/5">Cancel</button>
              <button onClick={() => showConfirm.type==="remove"?handleRemove(showConfirm.staff):handleSuspend(showConfirm.staff)} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase ${showConfirm.type==="remove"?"bg-rose-500 text-white":"bg-amber-500 text-black"}`}>{showConfirm.type==="remove"?"Remove":showConfirm.staff.status==="suspended"?"Reactivate":"Suspend"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}