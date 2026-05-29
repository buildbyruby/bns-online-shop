"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Home, MessageSquare, LogOut, Send, UserPlus, X, Users, Edit2, Trash2, CheckCircle, Circle, ArrowLeft, ShoppingCart, Plus, Minus, Package, Copy, Check, ClipboardList } from "lucide-react";

export default function SalesDashboard() {
  const [activeTab, setActiveTab] = useState("Home");
  const [showCustModal, setShowCustModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [showOrderCart, setShowOrderCart] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [showInvoice, setShowInvoice] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calls, setCalls] = useState<any[]>([]);
  const [custForm, setCustForm] = useState({ id: null as any, customer_name: "", phone: "", estate: "", court: "", house: "", prefs: "" });
  const bottomRef = useRef<any>(null);
  const dmBottomRef = useRef<any>(null);
  const [dmWithAdmin, setDmWithAdmin] = useState(false);
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [newDmMsg, setNewDmMsg] = useState("");
  const router = useRouter();

  useEffect(() => { initUser(); }, []);
  useEffect(() => {
    if (!dmWithAdmin || !currentStaff) return;
    loadDmMessages(currentStaff.id);
    const sub = supabase.channel(`dm-sales-${currentStaff.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (p: any) => {
          const m = p.new;
          if ((m.sender_id === currentStaff.id && m.receiver_id === "ADMIN") ||
              (m.sender_id === "ADMIN" && m.receiver_id === currentStaff.id)) {
            setDmMessages(prev => [...prev, m]);
          }
        }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [dmWithAdmin, currentStaff]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { dmBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [dmMessages]);
  useEffect(() => {
    const q = customerSearch.toLowerCase();
    if (!q) { setFilteredCustomers(customers); return; }
    setFilteredCustomers(customers.filter(c =>
      c.customer_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q)
    ));
  }, [customerSearch, customers]);
  useEffect(() => {
    if (allOrders.length > 0 && customers.length > 0) {
      const idsWithOrders = [...new Set(allOrders.map((o: any) => o.customer_id).filter(Boolean))];
      setCalls(customers.filter(c => idsWithOrders.includes(c.id)).map(c => ({ id: c.id, name: c.customer_name, done: false })));
    } else { setCalls([]); }
  }, [allOrders, customers]);

  const initUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/sales/login"); return; }
      const user = session.user;
      setAuthUser(user);
      const userEmail = user.email;
      const { data: staff } = await supabase.from("sales_force").select("*").eq("email", userEmail).single();
      if (staff) {
        setCurrentStaff(staff);
        await Promise.all([loadCustomers(), loadMessages(staff.id), loadProducts(), loadAllOrders(staff.id)]);
        const ch = supabase.channel(`sales-${staff.id}-${Date.now()}`);
        ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${staff.id}` }, (p: any) => setMessages(prev => [...prev, p.new]));
        ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.ALL` }, (p: any) => setMessages(prev => [...prev, p.new]));
        ch.subscribe();
      }
    } catch { router.push("/sales/login"); }
    finally { setLoading(false); }
  };

  const loadCustomers = async () => {
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (data) { setCustomers(data); setFilteredCustomers(data); }
  };

  const loadMessages = async (sfId: string) => {
    const { data } = await supabase.from("messages").select("*")
      .or(`receiver_id.eq.${sfId},sender_id.eq.${sfId},receiver_id.eq.ALL`)
      .order("created_at");
    if (data) setMessages(data);
  };

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*, categories(name)").order("name");
    if (data) setProducts(data);
  };

  const loadCustomerOrders = async (customerId: string) => {
    const { data } = await supabase.from("orders").select("*").eq("customer_id", customerId).order("created_at", { ascending: false });
    if (data) setCustomerOrders(data);
  };

  const loadAllOrders = async (sfId: string) => {
    const { data } = await supabase.from("orders").select("*, customers(customer_name, phone)").eq("salesperson_id", sfId).order("created_at", { ascending: false });
    if (data) setAllOrders(data);
  };

  const openCustomer = async (c: any) => { setSelectedCustomer(c); await loadCustomerOrders(c.id); };

  const addToCart = (product: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), qty: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const processOrder = async () => {
    if (!currentStaff || !selectedCustomer || cart.length === 0) return;
    setSaving(true);
    const orderRef = "ORD-" + Math.random().toString(36).substr(2, 5).toUpperCase();
    const items = cart.map(i => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.qty, subtotal: i.price * i.qty }));
    const { data, error } = await supabase.from("orders").insert([{ customer_id: selectedCustomer.id, salesperson_id: currentStaff.id, items, total_amount: cartTotal, status: "pending", order_ref: orderRef }]).select().single();
    if (error) { alert("Could not place order: " + error.message); setSaving(false); return; }
    setShowOrderCart(false); setCart([]);
    await loadCustomerOrders(selectedCustomer.id);
    await loadAllOrders(currentStaff.id);
    setShowInvoice({ ...data, customer: selectedCustomer, staff: currentStaff });
    setSaving(false);
  };

  const copyInvoice = (order: any) => {
    const lines = (order.items||[]).map((i: any) => `• ${i.name} × ${i.quantity}    KSH ${(i.subtotal||i.price*i.quantity).toLocaleString()}`).join("\n");
    const text = `🛍️ ORDER SUMMARY\n\n📋 *Ref:* ${order.order_ref}\n📅 *Date:* ${new Date(order.created_at).toLocaleDateString("en-KE")}\n👤 *Customer:* ${order.customer?.customer_name}\n📞 *Phone:* ${order.customer?.phone}\n\n─────────────────────\n${lines}\n─────────────────────\n💰 *TOTAL: KSH ${Number(order.total_amount).toLocaleString()}*\n\nSold by: ${order.staff?.name} | ${order.staff?.region}\nBNS Systems`;
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCustomer = async (e: any) => {
    e.preventDefault(); if (!authUser) return; setSaving(true);
    const address = [custForm.estate, custForm.court, custForm.house].filter(Boolean).join(", ");
    const payload = { customer_name: custForm.customer_name, business_name: custForm.customer_name, contact_person: custForm.customer_name, phone: custForm.phone, address, type: "B2C", preferences: custForm.prefs ? { likes: custForm.prefs } : {}, created_by: authUser.id };
    let error: any;
    if (isEditing && custForm.id) { const r = await supabase.from("customers").update(payload).eq("id", custForm.id); error = r.error; }
    else { const r = await supabase.from("customers").insert([payload]); error = r.error; }
    if (error) { alert("Could not save: " + error.message); setSaving(false); return; }
    await loadCustomers();
    setShowCustModal(false); setIsEditing(false); setCustForm({ id: null, customer_name: "", phone: "", estate: "", court: "", house: "", prefs: "" }); setSaving(false);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Remove this contact?")) return;
    await supabase.from("customers").delete().eq("id", id);
    await loadCustomers();
  };

  const openEditCustomer = (c: any) => {
    const parts = (c.address||"").split(", ");
    setCustForm({ id: c.id, customer_name: c.customer_name||"", phone: c.phone||"", estate: parts[0]||"", court: parts[1]||"", house: parts[2]||"", prefs: c.preferences?.likes||"" });
    setIsEditing(true); setShowCustModal(true);
  };

  const sendMessage = async () => {
    if (!newMsg.trim()||!currentStaff) return;
    const msg = { sender_id: currentStaff.id, receiver_id: "ALL", content: newMsg.trim(), is_admin_sender: false };
    await supabase.from("messages").insert([msg]);
    setMessages(prev => [...prev, { ...msg, created_at: new Date().toISOString() }]);
    setNewMsg("");
  };

  const loadDmMessages = async (sfId: string) => {
    const { data } = await supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${sfId},receiver_id.eq.ADMIN),and(sender_id.eq.ADMIN,receiver_id.eq.${sfId})`)
      .order("created_at");
    if (data) setDmMessages(data);
  };

  const sendDmMessage = async () => {
    if (!newDmMsg.trim() || !currentStaff) return;
    const msg = { sender_id: currentStaff.id, receiver_id: "ADMIN", content: newDmMsg.trim(), is_admin_sender: false };
    await supabase.from("messages").insert([msg]);
    setDmMessages(prev => [...prev, { ...msg, created_at: new Date().toISOString() }]);
    setNewDmMsg("");
  };

  const toggleCall = (id: any) => setCalls(calls.map(c => c.id === id ? { ...c, done: !c.done } : c));
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };
  const fmt = (n: number) => n >= 1000000 ? `KSH ${(n/1000000).toFixed(2)}M` : `KSH ${n.toLocaleString()}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"2-digit"});
  const todayOrders = allOrders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());

  if (loading) return <div className="flex h-screen bg-[#080808] text-white items-center justify-center"><p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 animate-pulse">Loading...</p></div>;
  if (!currentStaff) return <div className="flex h-screen bg-[#080808] text-white items-center justify-center flex-col gap-6"><p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Account not linked to staff list</p><button onClick={handleLogout} className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white border border-white/10 px-6 py-3 rounded-xl">Log Out</button></div>;

  return (
    <div className="flex h-screen bg-[#080808] text-white font-sans overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-black/95 backdrop-blur-xl border-r border-white/5 flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 lg:p-8 pb-8 flex items-start justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tighter italic uppercase">BNS<span className="text-zinc-600">.OS</span></h1>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1">Work Space</p>
            <p className="text-[9px] font-bold text-zinc-700 uppercase mt-1">{currentStaff.name} · {currentStaff.region}</p>
          </div>
          <button className="lg:hidden text-zinc-500 hover:text-white mt-1" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {[
            
            { id: "Customers", icon: Users, label: "My Contacts" },
            { id: "Orders", icon: ClipboardList, label: "Orders" },
            { id: "Chat", icon: MessageSquare, label: "Messages" },
          ].map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedCustomer(null); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === item.id ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white hover:bg-white/5"}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 lg:p-8 border-t border-white/5">
          <button onClick={handleLogout} className="text-zinc-600 hover:text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><LogOut size={18}/> Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 lg:h-24 border-b border-white/5 flex items-center justify-between px-4 lg:px-12 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-zinc-500 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
              {activeTab === "Customers" && selectedCustomer ? selectedCustomer.customer_name : activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "Customers" && !selectedCustomer && (
              <button onClick={() => { setIsEditing(false); setCustForm({ id: null, customer_name: "", phone: "", estate: "", court: "", house: "", prefs: "" }); setShowCustModal(true); }}
                className="bg-white text-black px-4 lg:px-6 py-2 lg:py-3 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
                <UserPlus size={14} fill="black"/> Add Contact
              </button>
            )}
            {activeTab === "Customers" && selectedCustomer && (
              <button onClick={() => { setCart([]); setShowOrderCart(true); }} className="bg-emerald-500 text-black px-4 lg:px-6 py-2 lg:py-3 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 hover:bg-emerald-400">
                <ShoppingCart size={14}/> Place Order
              </button>
            )}
          </div>
        </header>

        <div className={`flex-1 overflow-hidden ${activeTab !== "Chat" ? "overflow-y-auto p-4 lg:p-12" : ""}`}>

          {activeTab === "Home" && (
            <div className="space-y-6 lg:space-y-10">
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-white text-black p-6 lg:p-8 rounded-[2rem] shadow-xl">
                  <p className="text-[10px] font-black uppercase mb-1">My Customers</p>
                  <h3 className="text-3xl lg:text-4xl font-black italic">{customers.length}</h3>
                  <p className="text-[9px] text-zinc-500 mt-2">Total contacts</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 p-6 lg:p-8 rounded-[2rem]">
                  <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">My Orders</p>
                  <h3 className="text-3xl lg:text-4xl font-black italic">{allOrders.length}</h3>
                  <p className="text-[9px] text-zinc-600 mt-2">{todayOrders.length} today</p>
                </div>
              </div>
              {calls.length > 0 && (
                <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-10 rounded-[3rem]">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Follow Up</h4>
                  <div className="space-y-3">
                    {calls.map(call => (
                      <div key={call.id} className="flex justify-between items-center p-4 lg:p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                        <span className={`text-sm font-bold uppercase ${call.done?"line-through text-zinc-600":""}`}>{call.name}</span>
                        <button onClick={() => toggleCall(call.id)} className={`flex items-center gap-2 text-[9px] font-black uppercase px-4 py-2 rounded-lg transition-all ${call.done?"bg-emerald-500/20 text-emerald-500":"bg-white text-black"}`}>
                          {call.done?<CheckCircle size={14}/>:<Circle size={14}/>} {call.done?"Done":"Mark Done"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "Customers" && !selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 flex-shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search by name, phone or ID..." className="bg-transparent outline-none text-sm flex-1 text-white placeholder:text-zinc-500"/>
                {customerSearch && <button onClick={() => setCustomerSearch("")} className="text-zinc-400 text-xs">✕</button>}
              </div>
              {customers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24">
                  <Users size={40} className="text-zinc-800 mb-4"/>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No contacts yet</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {filteredCustomers.map(c => (
                  <div key={c.id} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 lg:p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 cursor-pointer" onClick={() => openCustomer(c)}>
                        <h4 className="text-lg font-black uppercase tracking-tighter italic">{c.customer_name}</h4>
                        <p className="text-xs text-zinc-500 font-bold">{c.phone}</p>
                        <p className="text-[10px] font-black text-emerald-500 mt-2 uppercase tracking-wide">View Orders & Place New →</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditCustomer(c)} className="p-2 lg:p-3 bg-white/5 rounded-xl hover:bg-white hover:text-black transition-all"><Edit2 size={14}/></button>
                        <button onClick={() => handleDeleteCustomer(c.id)} className="p-2 lg:p-3 bg-white/5 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 transition-all"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    {c.address && <div className="mt-3 border-t border-white/5 pt-3"><p className="text-[9px] text-zinc-600 uppercase font-black mb-1">Location</p><p className="text-[10px] font-black">{c.address}</p></div>}
                    {c.preferences?.likes && <div className="mt-3 p-3 bg-white/5 rounded-2xl"><p className="text-[9px] text-zinc-600 uppercase font-black mb-1">Notes</p><p className="text-[10px] font-medium italic opacity-70">"{c.preferences.likes}"</p></div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Customers" && selectedCustomer && (
            <div className="space-y-6">
              <button onClick={() => setSelectedCustomer(null)} className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-all">
                <ArrowLeft size={16}/> Back to Contacts
              </button>
              <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 lg:p-8">
                <h3 className="text-2xl font-black uppercase italic">{selectedCustomer.customer_name}</h3>
                <p className="text-zinc-500 font-bold mt-1">{selectedCustomer.phone}</p>
                {selectedCustomer.address && <p className="text-[10px] text-zinc-600 mt-1">{selectedCustomer.address}</p>}
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-8 rounded-[3rem]">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-6">Order History</p>
                {customerOrders.length === 0 ? (
                  <div className="flex flex-col items-center py-12"><Package size={36} className="text-zinc-800 mb-3"/><p className="text-[10px] font-black text-zinc-700 uppercase">No orders yet — click Place Order</p></div>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map(order => (
                      <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 lg:p-6">
                        <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                          <div><p className="text-[10px] font-black uppercase">{order.order_ref}</p><p className="text-[9px] text-zinc-600">{fmtDate(order.created_at)}</p></div>
                          <div className="flex items-center gap-3">
                            <p className="text-emerald-400 font-black">KSH {Number(order.total_amount).toLocaleString()}</p>
                            <button onClick={() => setShowInvoice({ ...order, customer: selectedCustomer, staff: currentStaff })} className="flex items-center gap-1 px-3 py-2 bg-white/5 rounded-xl text-[9px] font-black uppercase hover:bg-white/10"><Copy size={12}/> Invoice</button>
                          </div>
                        </div>
                        <div className="space-y-1">{(order.items||[]).map((item: any, i: number) => (<p key={i} className="text-[9px] text-zinc-500">{item.name} × {item.quantity} — KSH {(item.subtotal||item.price*item.quantity).toLocaleString()}</p>))}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Orders" && (
            <div className="space-y-6 lg:space-y-8">
              {(() => {
                const today = new Date().toISOString().slice(0,10);
                const todayO = allOrders.filter(o => new Date(o.created_at).toISOString().slice(0,10) === today);
                const olderO = allOrders.filter(o => new Date(o.created_at).toISOString().slice(0,10) !== today);
                return (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Today</p>
                        <p className="text-[9px] font-black text-emerald-500">{todayO.length} orders · {allOrders.length} total</p>
                      </div>
                      {todayO.length === 0 ? (
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 flex flex-col items-center">
                          <ClipboardList size={36} className="text-zinc-800 mb-3"/>
                          <p className="text-[10px] font-black text-zinc-700 uppercase">No orders today yet</p>
                        </div>
                      ) : todayO.map(order => (
                        <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 lg:p-6 mb-4">
                          <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                            <div><p className="text-sm font-black uppercase">{order.customers?.customer_name || "Customer"}</p><p className="text-[9px] text-zinc-500 mt-0.5">{order.order_ref} · {new Date(order.created_at).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p></div>
                            <div className="flex items-center gap-3">
                              <p className="text-emerald-400 font-black text-lg">KSH {Number(order.total_amount).toLocaleString()}</p>
                              <button onClick={() => setShowInvoice({ ...order, customer: order.customers, staff: currentStaff })} className="flex items-center gap-1 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase"><Copy size={12}/> Invoice</button>
                            </div>
                          </div>
                          <div className="space-y-1 border-t border-white/5 pt-3">{(order.items||[]).map((item: any, i: number) => (<p key={i} className="text-[9px] text-zinc-500">{item.name} × {item.quantity} — KSH {(item.subtotal||item.price*item.quantity).toLocaleString()}</p>))}</div>
                        </div>
                      ))}
                    </div>
                    {olderO.length > 0 && (
                      <div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Previous Orders</p>
                        {olderO.map(order => (
                          <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 lg:p-6 mb-4">
                            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                              <div><p className="text-[11px] font-black uppercase">{order.customers?.customer_name || "Customer"}</p><p className="text-[9px] text-zinc-500 mt-0.5">{order.order_ref} · {fmtDate(order.created_at)}</p></div>
                              <div className="flex items-center gap-3">
                                <p className="text-emerald-400 font-black">KSH {Number(order.total_amount).toLocaleString()}</p>
                                <button onClick={() => setShowInvoice({ ...order, customer: order.customers, staff: currentStaff })} className="flex items-center gap-1 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase"><Copy size={12}/> Invoice</button>
                              </div>
                            </div>
                            <div className="space-y-1 border-t border-white/5 pt-3">{(order.items||[]).map((item: any, i: number) => (<p key={i} className="text-[9px] text-zinc-500">{item.name} × {item.quantity} — KSH {(item.subtotal||item.price*item.quantity).toLocaleString()}</p>))}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === "Chat" && (
            <div className="h-full flex overflow-hidden bg-white/[0.02] border border-white/5 rounded-[3rem]">
              <div className="w-44 border-r border-white/5 flex flex-col flex-shrink-0">
                <button onClick={() => setDmWithAdmin(false)}
                  className={`p-5 text-left border-b border-white/5 transition-all ${!dmWithAdmin ? "bg-white/10" : "hover:bg-white/5"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                    <span className="text-[10px] font-black uppercase">Group</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 pl-4">Everyone</p>
                </button>
                <button onClick={() => setDmWithAdmin(true)}
                  className={`p-5 text-left border-b border-white/5 transition-all ${dmWithAdmin ? "bg-white/10" : "hover:bg-white/5"}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0">A</div>
                    <div>
                      <p className="text-[10px] font-black uppercase">Admin</p>
                      <p className="text-[8px] text-zinc-600">Private</p>
                    </div>
                  </div>
                </button>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
                  {dmWithAdmin ? (
                    <>
                      <div className="w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center font-black text-sm">A</div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Admin</p>
                        <p className="text-[8px] text-zinc-600">Direct message — only you and Admin see this</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-xs font-black uppercase tracking-[0.2em]">Team Group Chat</h4>
                      <span className="text-[9px] text-zinc-600 ml-auto hidden lg:block">Everyone can see messages</span>
                    </>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                  {dmWithAdmin ? (
                    <>
                      {dmMessages.length === 0 && <p className="text-center text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em] mt-12">No messages with Admin yet</p>}
                      {dmMessages.map((m, i) => {
                        const isMe = m.sender_id === currentStaff.id && !m.is_admin_sender;
                        return (
                          <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <p className="text-[8px] font-black text-zinc-600 uppercase mb-1 px-1">{isMe ? "You" : "Admin"}</p>
                            <div className={`max-w-xs px-5 py-3 rounded-2xl text-xs font-medium ${isMe ? "bg-emerald-500 text-black" : "bg-white text-black"}`}>
                              {m.content}
                            </div>
                            <p className="text-[8px] text-zinc-700 px-1 mt-0.5">{new Date(m.created_at).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}</p>
                          </div>
                        );
                      })}
                      <div ref={dmBottomRef} />
                    </>
                  ) : (
                    <>
                      {messages.filter(m => m.receiver_id === "ALL").length === 0 && <p className="text-center text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em] mt-12">No messages yet</p>}
                      {messages.filter(m => m.receiver_id === "ALL").map((m, i) => {
                        const isMe = m.sender_id === currentStaff.id;
                        const isAdmin = m.is_admin_sender;
                        const senderLabel = isAdmin ? "Admin" : isMe ? "You" : "Team";
                        return (
                          <div key={i} className={`flex flex-col ${isMe || isAdmin ? "items-end" : "items-start"}`}>
                            <p className="text-[8px] font-black text-zinc-600 uppercase mb-1 px-1">{senderLabel}</p>
                            <div className={`max-w-xs px-5 py-3 rounded-2xl text-xs font-medium ${isAdmin ? "bg-white text-black" : isMe ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-white"}`}>
                              {m.content}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef}/>
                    </>
                  )}
                </div>
                <div className="p-4 lg:p-6 flex-shrink-0 border-t border-white/5">
                  {dmWithAdmin ? (
                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <input value={newDmMsg} onChange={e => setNewDmMsg(e.target.value)} onKeyDown={e => e.key==="Enter"&&sendDmMessage()} placeholder="Message Admin..." className="bg-transparent flex-1 outline-none text-sm px-4"/>
                      <button onClick={sendDmMessage} className="p-3 bg-white text-black rounded-xl hover:scale-105 transition-transform"><Send size={18}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key==="Enter"&&sendMessage()} placeholder="Send a message to the team..." className="bg-transparent flex-1 outline-none text-sm px-4"/>
                      <button onClick={sendMessage} className="p-3 bg-white text-black rounded-xl hover:scale-105 transition-transform"><Send size={18}/></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showOrderCart && (
        <div className="fixed inset-0 bg-[#080808] z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 lg:p-8 border-b border-white/5 flex-shrink-0">
            <div><h2 className="text-xl font-black italic uppercase">New Order</h2><p className="text-[9px] text-zinc-500 mt-1">{selectedCustomer?.customer_name}</p></div>
            <button onClick={() => setShowOrderCart(false)}><X size={28}/></button>
          </div>
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Products</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-24 lg:h-28 object-cover"/> : <div className="w-full h-24 lg:h-28 bg-white/5 flex items-center justify-center"><Package size={24} className="text-zinc-700"/></div>}
                    <div className="p-3 lg:p-4">
                      <p className="text-[10px] font-black uppercase">{p.name}</p>
                      <p className="text-emerald-400 font-black mt-1">KSH {Number(p.price).toLocaleString()}</p>
                      <button onClick={() => addToCart(p)} className="w-full mt-2 py-2 bg-white text-black rounded-xl text-[9px] font-black uppercase hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1">
                        <Plus size={12}/> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-80 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col max-h-64 lg:max-h-none">
              <div className="p-4 lg:p-6 flex-1 overflow-y-auto">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Cart {cart.length>0&&`(${cart.length})`}</p>
                {cart.length === 0 ? <p className="text-[9px] text-zinc-700 mt-4 text-center">No items yet</p> : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="bg-white/5 rounded-2xl p-3 lg:p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[10px] font-black uppercase flex-1 mr-2">{item.name}</p>
                          <button onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-rose-400"><X size={14}/></button>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateCartQty(item.id,-1)} className="p-1 bg-white/10 rounded-lg"><Minus size={12}/></button>
                          <span className="text-sm font-black w-6 text-center">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.id,1)} className="p-1 bg-white/10 rounded-lg"><Plus size={12}/></button>
                          <span className="text-emerald-400 font-black text-[10px] ml-auto">KSH {(item.price*item.qty).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 lg:p-6 border-t border-white/5 flex-shrink-0">
                <div className="flex justify-between mb-4"><span className="text-[10px] font-black uppercase text-zinc-500">Total</span><span className="font-black text-emerald-400">KSH {cartTotal.toLocaleString()}</span></div>
                <button onClick={processOrder} disabled={cart.length===0||saving} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-40">
                  {saving?"Processing...":"Process Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInvoice && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-md p-8 lg:p-10 rounded-[3rem]">
            <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black italic uppercase">Invoice</h2><button onClick={() => setShowInvoice(null)}><X size={24}/></button></div>
            <div className="bg-white/5 rounded-2xl p-6 space-y-3 font-mono text-xs">
              <p className="font-black text-base">🛍️ ORDER SUMMARY</p>
              <div className="border-t border-white/10 pt-3 space-y-1">
                <p>📋 <span className="font-black">Ref:</span> {showInvoice.order_ref}</p>
                <p>📅 <span className="font-black">Date:</span> {fmtDate(showInvoice.created_at)}</p>
                <p>👤 <span className="font-black">Customer:</span> {showInvoice.customer?.customer_name}</p>
                <p>📞 <span className="font-black">Phone:</span> {showInvoice.customer?.phone}</p>
              </div>
              <div className="border-t border-white/10 pt-3 space-y-1">{(showInvoice.items||[]).map((item: any, i: number) => (<p key={i}>• {item.name} × {item.quantity} — KSH {(item.subtotal||item.price*item.quantity).toLocaleString()}</p>))}</div>
              <div className="border-t border-white/10 pt-3"><p className="text-emerald-400 font-black text-sm">💰 TOTAL: KSH {Number(showInvoice.total_amount).toLocaleString()}</p></div>
              <div className="border-t border-white/10 pt-3 text-zinc-500"><p>Sold by: {showInvoice.staff?.name} | {showInvoice.staff?.region}</p><p>BNS Systems</p></div>
            </div>
            <button onClick={() => copyInvoice(showInvoice)} className="w-full mt-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 bg-white text-black hover:scale-105 transition-transform">
              {copied?<><Check size={14}/> Copied!</>:<><Copy size={14}/> Copy for WhatsApp</>}
            </button>
          </div>
        </div>
      )}

      {showCustModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-lg p-8 lg:p-12 rounded-[3rem]">
            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black italic uppercase">{isEditing?"Edit Contact":"New Contact"}</h2><button onClick={() => setShowCustModal(false)}><X size={28}/></button></div>
            <form onSubmit={handleSaveCustomer} className="grid grid-cols-2 gap-4 lg:gap-6">
              <div className="col-span-2"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Full Name *</label>
                <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold text-sm" value={custForm.customer_name} onChange={e=>setCustForm({...custForm,customer_name:e.target.value})} required placeholder="Customer full name"/>
              </div>
              <div className="col-span-2"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Phone *</label>
                <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold text-sm" value={custForm.phone} onChange={e=>setCustForm({...custForm,phone:e.target.value})} required placeholder="07..."/>
              </div>
              <div><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Estate</label>
                <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold text-sm" value={custForm.estate} onChange={e=>setCustForm({...custForm,estate:e.target.value})} placeholder="e.g. South C"/>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Court</label>
                  <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold text-sm" value={custForm.court} onChange={e=>setCustForm({...custForm,court:e.target.value})} placeholder="Alpha"/>
                </div>
                <div className="flex-1"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">House</label>
                  <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold text-sm" value={custForm.house} onChange={e=>setCustForm({...custForm,house:e.target.value})} placeholder="B4"/>
                </div>
              </div>
              <div className="col-span-2"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Notes</label>
                <textarea className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-white font-bold text-sm h-20 resize-none" value={custForm.prefs} onChange={e=>setCustForm({...custForm,prefs:e.target.value})} placeholder="What do they like?"/>
              </div>
              <button type="submit" disabled={saving} className="col-span-2 bg-white text-black py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] disabled:opacity-50">{saving?"Saving...":isEditing?"Update Contact":"Save Contact"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
