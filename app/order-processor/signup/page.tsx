"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ClipboardList, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OrderProcessorSignup() {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { full_name: formData.name, phone_number: formData.phone, role: "ORDER_PROCESSOR" } }
    });
    if (error) { alert(error.message); setLoading(false); return; }
    router.push("/order-processor/dashboard");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-5 py-10 sm:p-8">
      <div className="w-full max-w-sm space-y-8 sm:space-y-10">
        <Link href="/" className="text-[9px] uppercase tracking-widest text-zinc-500 flex items-center gap-2 hover:text-white transition-colors">
          <ArrowLeft size={12}/> Back to Roles
        </Link>
        <div className="space-y-2">
          <ClipboardList size={32} />
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic">Register Processor</h1>
        </div>
        <form onSubmit={handleSignup} className="space-y-6">
          <input type="text" placeholder="FULL NAME" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white" onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input type="text" placeholder="PHONE NUMBER" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white font-mono" onChange={e => setFormData({...formData, phone: e.target.value})} required />
          <input type="email" placeholder="EMAIL ADDRESS" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white" onChange={e => setFormData({...formData, email: e.target.value})} required />
          <input type="password" placeholder="CREATE PASSWORD" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white font-mono" onChange={e => setFormData({...formData, password: e.target.value})} required />
          <button disabled={loading} className="w-full bg-white text-black py-4 text-[11px] sm:text-[10px] font-bold uppercase tracking-widest disabled:opacity-50">
            {loading ? "Registering..." : "Create Processor Account"}
          </button>
        </form>
        <Link href="/order-processor/login" className="block text-center text-[9px] uppercase tracking-widest text-zinc-500 hover:text-white">
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
}
