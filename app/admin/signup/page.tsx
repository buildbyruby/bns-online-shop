"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function AdminSignup() {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", password: "", inviteCode: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/staff/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "admin",
        inviteCode: formData.inviteCode,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
      }),
    });
    const result = await res.json();
    if (!res.ok) { alert(result.error || "Signup failed."); setLoading(false); return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
    if (signInError) { alert(signInError.message); setLoading(false); return; }
    if (formData.email) { await supabase.from("admins").update({ last_login: new Date().toISOString() }).eq("email", formData.email); }

    router.push("/admin/dashboard");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-5 py-10 sm:p-8">
      <div className="w-full max-w-sm space-y-8 sm:space-y-10">
        <Link href="/" className="text-[9px] uppercase tracking-widest text-zinc-400 flex items-center gap-2 hover:text-white transition-colors"><ArrowLeft size={12}/> Back to Roles</Link>
        <div className="space-y-2"><Shield size={32} className="text-white" /><h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic">Register Admin</h1></div>
        <form onSubmit={handleSignup} className="space-y-6">
          <input type="text" placeholder="FULL NAME" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white" onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input type="text" placeholder="PHONE NUMBER" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white font-mono" onChange={e => setFormData({...formData, phone: e.target.value})} required />
          <input type="email" placeholder="EMAIL ADDRESS" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white" onChange={e => setFormData({...formData, email: e.target.value})} required />
          <div className="relative"><input type={showPass ? "text" : "password"} placeholder="PASSWORD" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white font-mono pr-8" onChange={e => setFormData({...formData, password: e.target.value})} required /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-0 top-3 text-zinc-400 hover:text-white">{showPass ? <EyeOff size={14}/> : <Eye size={14}/>}</button></div>
          <div className="relative"><input type={showCode ? "text" : "password"} placeholder="INVITE CODE" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white font-mono pr-8" onChange={e => setFormData({...formData, inviteCode: e.target.value})} required /><button type="button" onClick={() => setShowCode(!showCode)} className="absolute right-0 top-3 text-zinc-400 hover:text-white">{showCode ? <EyeOff size={14}/> : <Eye size={14}/>}</button></div>
          <button disabled={loading} className="w-full bg-white text-black py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">{loading ? "Initializing..." : "Activate Admin Access"}</button>
        </form>
      </div>
    </div>
  );
}

