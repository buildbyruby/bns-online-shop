"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ClipboardList, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function OrderProcessorSignup() {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    let userId = "";

    const { data, error } = await supabase.auth.signUp({ email: formData.email, password: formData.password, options: { data: { full_name: formData.name, phone_number: formData.phone, role: "PROCESSOR" } } });

    if (error && error.message.includes("already registered")) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
      if (signInError) { alert("Account exists but wrong password."); setLoading(false); return; }
      userId = signInData.user.id;
    } else if (error) {
      alert(error.message); setLoading(false); return;
    } else if (data.user) {
      userId = data.user.id;
    }

    const { error: insertError } = await supabase.from("order_processors").upsert({ id: userId, name: formData.name, phone: formData.phone });
    if (insertError) { alert("Insert error: " + insertError.message); setLoading(false); return; }

    localStorage.setItem("userEmail", formData.email); router.push("/order-processor/dashboard");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-5 py-10 sm:p-8">
      <div className="w-full max-w-sm space-y-8 sm:space-y-10">
        <Link href="/" className="text-[9px] uppercase tracking-widest text-zinc-400 flex items-center gap-2 hover:text-white transition-colors"><ArrowLeft size={12}/> Back to Roles</Link>
        <div className="space-y-2"><ClipboardList size={32} className="text-white" /><h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic">Register Processor</h1></div>
        <form onSubmit={handleSignup} className="space-y-6">
          <input type="text" placeholder="FULL NAME" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white" onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input type="text" placeholder="PHONE NUMBER" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white font-mono" onChange={e => setFormData({...formData, phone: e.target.value})} required />
          <input type="email" placeholder="EMAIL ADDRESS" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white" onChange={e => setFormData({...formData, email: e.target.value})} required />
          <div className="relative"><input type={showPass ? "text" : "password"} placeholder="PASSWORD" className="w-full bg-transparent border-b border-white/10 py-3 text-xs outline-none focus:border-white font-mono pr-8" onChange={e => setFormData({...formData, password: e.target.value})} required /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-0 top-3 text-zinc-400 hover:text-white">{showPass ? <EyeOff size={14}/> : <Eye size={14}/>}</button></div>
          <button disabled={loading} className="w-full bg-white text-black py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">{loading ? "Creating..." : "Create Processor Account"}</button>
        </form>
        <Link href="/order-processor/login" className="block text-center text-[9px] uppercase tracking-widest text-zinc-400 hover:text-white">Already have an account? Log in</Link>
      </div>
    </div>
  );
}
