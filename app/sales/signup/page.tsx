"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BadgeDollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";

const REGIONS = ["Buruburu Phase 5","Buruburu Phase 4","Buruburu Phase 3","Buruburu Phase 2","Buruburu Phase 1","Harambee","Outskirts"];

export default function SalesSignup() {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", region: "Buruburu Phase 1", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { full_name: formData.name, phone_number: formData.phone, region: formData.region, role: "SALES" } }
    });
    if (error) { alert(error.message); setLoading(false); return; }
    router.push("/sales/dashboard");
    setLoading(false);
  };

  const inp = "w-full bg-transparent border-b border-white/10 py-4 px-0 text-sm outline-none focus:border-white transition-colors";
  const lbl = "text-[9px] font-black uppercase tracking-widest text-zinc-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-5 py-10 sm:p-8">
      <div className="w-full max-w-sm space-y-8 sm:space-y-10">
        <Link href="/" className="text-[9px] uppercase tracking-widest text-zinc-500 flex items-center gap-2 hover:text-white transition-colors">
          <ArrowLeft size={12}/> Back
        </Link>
        <div className="space-y-2">
          <BadgeDollarSign size={32} />
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic">Join the Team</h1>
        </div>
        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-1">
            <label className={lbl}>Full Name</label>
            <input type="text" className={inp} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Joy Wanjiku"/>
          </div>
          <div className="space-y-1">
            <label className={lbl}>Phone Number</label>
            <input type="text" className={`${inp} font-mono`} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="07..."/>
          </div>
          <div className="space-y-1">
            <label className={lbl}>Email Address</label>
            <input type="email" className={inp} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="your@email.com"/>
          </div>
          <div className="space-y-1">
            <label className={lbl}>Your Region</label>
            <select className={inp} value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})}>
              {REGIONS.map(r => <option key={r} className="bg-black">{r}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className={lbl}>Create a Password</label>
            <input type="password" className={`${inp} font-mono`} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="Something you will remember"/>
          </div>
          <button disabled={loading} className="w-full bg-white text-black py-4 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 mt-4">
            {loading ? "Setting up your account..." : "Create My Account"}
          </button>
        </form>
        <Link href="/sales/login" className="block text-center text-[9px] uppercase tracking-widest text-zinc-500 hover:text-white">
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
}
