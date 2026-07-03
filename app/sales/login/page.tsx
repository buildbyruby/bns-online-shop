"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BadgeDollarSign, ArrowRight, UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function SalesLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetPhone, setResetPhone] = useState(typeof window !== "undefined" ? localStorage.getItem("userEmail") || "" : "");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert("Login failed. Check your email and password."); setLoading(false); return; }
    const { data: staff } = await supabase.from("sales_force").select("status").eq("email", email).single();
    if (staff?.status === "suspended") {
      await supabase.auth.signOut();
      alert("Your account has been suspended. Contact your admin.");
      setLoading(false); return;
    }
    if (staff?.status === "removed") {
      await supabase.auth.signOut();
      alert("This account no longer exists. Contact your admin.");
      setLoading(false); return;
    }
    await supabase.from("sales_force").update({ last_login: new Date().toISOString() }).eq("email", email);
    localStorage.setItem("userEmail", email); router.push("/sales/dashboard");
    setLoading(false);
  };

  const handleForgotPassword = async (e: any) => {
    e.preventDefault();
    setResetLoading(true);
    const email = resetPhone;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sales/reset-password`,
    });
    if (error) { alert("Could not send reset email: " + error.message); setResetLoading(false); return; }
    setResetSent(true);
    setResetLoading(false);
  };

  if (showForgot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white px-5 py-10 sm:p-8">
        <div className="w-full max-w-sm space-y-8 sm:space-y-10">
          <button onClick={() => { setShowForgot(false); setResetSent(false); }} className="text-[9px] uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-2">
            ← Back to Login
          </button>
          <div className="space-y-2">
            <BadgeDollarSign size={32} />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic">Reset Password</h1>
            <p className="text-[10px] text-zinc-400">Enter your email address and we'll send you a password reset link.</p>
          </div>
          {resetSent ? (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center space-y-3">
              <p className="text-[11px] font-black uppercase text-emerald-400">Reset link sent!</p>
              <p className="text-[9px] text-zinc-400">Check your email inbox and click the link to reset your password.</p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6"><p className="text-[10px] text-zinc-400">Sending reset link to <span className="text-white font-mono">{resetPhone}</span></p>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Email Address</label>
                <input type="email" className="w-full bg-transparent border-b border-white/10 py-4 px-4 text-sm outline-none focus:border-white font-mono"
                  value={resetPhone} onChange={e => setResetPhone(e.target.value)} placeholder="your@email.com" required />
              </div>
              <button disabled={resetLoading} className="w-full bg-white text-black py-4 text-[11px] sm:text-[10px] font-bold uppercase tracking-widest disabled:opacity-50">
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-5 py-10 sm:p-8">
      <div className="w-full max-w-sm space-y-8 sm:space-y-12">
        <div className="text-center space-y-2">
          <BadgeDollarSign size={40} className="mx-auto mb-4" />
          <h1 className="text-2xl font-black tracking-widest uppercase italic">Sales Login</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Email Address</label>
            <input type="email" className="w-full bg-transparent border-b border-white/10 py-4 px-4 text-sm outline-none focus:border-white font-mono"
              onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Your Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} className="w-full bg-transparent border-b border-white/10 py-4 px-4 text-sm outline-none focus:border-white font-mono pr-12"
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <button disabled={loading} className="w-full bg-white text-black py-4 text-[11px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? "Logging in..." : <> Log In <ArrowRight size={14}/> </>}
          </button>
        </form>
        <div className="text-center space-y-4">
          <button onClick={() => setShowForgot(true)} className="text-[9px] uppercase tracking-widest text-zinc-400 hover:text-white">
            Forgot Password?
          </button>
          <div className="flex flex-col gap-2">
            <Link href="/sales/signup" className="text-[9px] uppercase tracking-widest text-zinc-400 hover:text-white flex items-center justify-center gap-2">
              <UserPlus size={12}/> New here? Create your account
            </Link>
            <Link href="/" className="block text-[9px] uppercase tracking-widest text-zinc-400">Back</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
