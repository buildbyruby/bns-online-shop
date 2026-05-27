"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

const REGIONS = ["Buruburu Phase 5","Buruburu Phase 4","Buruburu Phase 3","Buruburu Phase 2","Buruburu Phase 1","Harambee","Outskirts"];

export default function AdminSignup() {
  const [formData, setFormData] = useState({ name: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const internalEmail = `${formData.phone}@admin.bns.com`;
    const { error } = await supabase.auth.signUp({
      email: internalEmail,
      password: formData.password,
      options: { data: { full_name: formData.name, phone_number: formData.phone, role: "ADMIN" } }
    });
    if (!error) router.push("/admin/dashboard");
    else alert(error.message);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-sm space-y-10">
        <Link href="/" className="text-[9px] uppercase tracking-widest text-zinc-500 flex items-center gap-2 hover:text-white transition-colors">
          <ArrowLeft size={12}/> Back to Roles
        </Link>
        <div className="space-y-2">
          <Shield size={32} className="text-white" />
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">Register Admin</h1>
        </div>
        <form onSubmit={handleSignup} className="space-y-6">
          <input type="text" placeholder="FULL NAME" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white" onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input type="text" placeholder="PHONE NUMBER" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white font-mono" onChange={e => setFormData({...formData, phone: e.target.value})} required />
          <input type="password" placeholder="CREATE PASSWORD" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white font-mono" onChange={e => setFormData({...formData, password: e.target.value})} required />
          <button disabled={loading} className="w-full bg-white text-black py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            {loading ? "Initializing..." : "Activate Admin Access"}
          </button>
        </form>
      </div>
    </div>
  );
}
