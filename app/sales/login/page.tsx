"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BadgeDollarSign, ArrowRight, UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function SalesLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetPhone, setResetPhone] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: `${phone}@sales.bns.com`, password });
    if (error) { alert("Login failed. Check your phone number and password."); setLoading(false); return; }
    const { data: staff } = await supabase.from("sales_force").select("status").eq("phone", phone).single();
    if (!staff || staff.status === "suspended") {
      await supabase.auth.signOut();
      alert("Your account has been suspended. Contact your admin.");
      setLoading(false); return;
    }
    if (staff.status === "removed") {
      await supabase.auth.signOut();
      alert("This account no longer exists. Contact your admin.");
      setLoading(false); return;
    }
    router.push("/sales/dashboard");
    setLoading(false);
  };

  const handleForgotPassword = async (e: any) => {
    e.preventDefault();
    setResetLoading(true);
    const email = `${resetPhone}@sales.bns.com`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sales/reset-password`,
    });
    if (error) { alert("Could not send reset email: " + error.message); setResetLoading(false); return; }
    setResetSent(true);
    setResetLoading(false);
  };

  if (showForgot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black p-6">
        <div className="w-full max-w-sm space-y-10">
          <button onClick={() => { setShowForgot(false); setResetSent(false); }} className="text-[9px] uppercase tracking-widest text-zinc-400 hover:text-black flex items-center gap-2">
            ← Back to Login
          </button>
          <div className="space-y-2">
            <BadgeDollarSign size={32} />
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Reset Password</h1>
            <p className="text-[10px] text-zinc-400">Enter your phone number and we'll send a reset link.</p>
          </div>
          {resetSent ? (
            <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-2xl text-center space-y-3">
              <p className="text-[11px] font-black uppercase text-emerald-600">Reset link sent!</p>
              <p className="text-[9px] text-zinc-400">Check your email inbox and click the link to reset your password.</p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Phone Number</label>
                <input type="text" className="w-full bg-zinc-50 border-b border-zinc-200 py-4 px-4 text-sm outline-none focus:border-black font-mono"
                  value={resetPhone} onChange={e => setResetPhone(e.target.value)} placeholder="07..." required />
              </div>
              <button disabled={resetLoading} className="w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50">
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-black p-6">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-2">
          <BadgeDollarSign size={40} className="mx-auto mb-4" />
          <h1 className="text-2xl font-black tracking-widest uppercase italic">Sales Login</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Your Phone Number</label>
            <input type="text" className="w-full bg-zinc-50 border-b border-zinc-100 py-4 px-4 text-sm outline-none focus:border-black font-mono"
              onChange={e => setPhone(e.target.value)} placeholder="07..." required />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Your Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} className="w-full bg-zinc-50 border-b border-zinc-100 py-4 px-4 text-sm outline-none focus:border-black font-mono pr-12"
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black">
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <button disabled={loading} className="w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? "Logging in..." : <> Log In <ArrowRight size={14}/> </>}
          </button>
        </form>
        <div className="text-center space-y-4">
          <button onClick={() => setShowForgot(true)} className="text-[9px] uppercase tracking-widest text-zinc-400 hover:text-black">
            Forgot Password?
          </button>
          <div className="flex flex-col gap-2">
            <Link href="/sales/signup" className="text-[9px] uppercase tracking-widest text-zinc-400 hover:text-black flex items-center justify-center gap-2">
              <UserPlus size={12}/> New here? Create your account
            </Link>
            <Link href="/" className="block text-[9px] uppercase tracking-widest text-zinc-200">Back</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
