"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";

export default function MpesaPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("customers").select("*").order("customer_name");
    if (data) setCustomers(data);
  };

  const selectCustomer = (c: any) => { setSelected(c); setPhone(c.phone || ""); };

  const submit = async (e: any) => {
    e.preventDefault();
    if (!selected || !amount) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("mpesa_payments").insert([{
      customer_id: selected.id,
      phone,
      amount: Number(amount),
      status: "pending_integration",
      requested_by: user?.id || null,
    }]);
    setSaving(false);
    setDone(true);
  };

  const reset = () => { setSelected(null); setAmount(""); setPhone(""); setDone(false); };

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 lg:p-12 flex justify-center">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black italic uppercase">M-Pesa Payment</h1>
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">Integration pending</p>
          <p className="text-[10px] text-zinc-400">This logs a payment request so it's ready to plug into the real M-Pesa STK Push once your developer adds the Safaricom API credentials. It does not charge anyone yet.</p>
        </div>

        {done ? (
          <div className="bg-white/[0.02] border border-emerald-500/20 rounded-[2rem] p-8 text-center">
            <Check size={32} className="mx-auto text-emerald-400 mb-4" />
            <p className="text-sm font-black uppercase">Request logged</p>
            <p className="text-[10px] text-zinc-400 mt-2">{selected.customer_name} · KSH {Number(amount).toLocaleString()} · {phone}</p>
            <button onClick={reset} className="mt-6 bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase">New Request</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {!selected ? (
              <>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer..." className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none text-sm" />
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {customers.filter(c => !search || c.customer_name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)).map(c => (
                    <button type="button" key={c.id} onClick={() => selectCustomer(c)} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-left">
                      <div>
                        <p className="text-[11px] font-black uppercase">{c.customer_name}</p>
                        <p className="text-[9px] text-zinc-400">{c.phone} {c.member_id ? `· ${c.member_id}` : ""}</p>
                      </div>
                    </button>
                  ))}
                  {customers.length === 0 && <p className="text-[10px] text-zinc-400 text-center py-6">No customers yet</p>}
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[11px] font-black uppercase">{selected.customer_name}</p>
                    <p className="text-[9px] text-zinc-400">{selected.member_id}</p>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="text-[9px] text-zinc-400 hover:text-white uppercase font-black">Change</button>
                </div>
                <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="M-Pesa phone number" className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none text-sm" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Amount (KSH)" className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none text-sm" />
                <button type="submit" disabled={saving} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50">
                  {saving ? "Logging..." : "Request Payment"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
