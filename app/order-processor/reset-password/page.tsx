"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ClipboardList, Eye, EyeOff } from "lucide-react";

export default function ProcessorResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: any) => {
    e.preventDefault();
    if (password !== confirm) { alert("Passwords don't match"); return; }
    if (password.length < 6) { alert("Minimum 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { alert(error.message); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push("/order-processor/login"), 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-5 py-10 sm:p-8">
      <div className="w-full max-w-sm space-y-8 sm:space-y-10">
        <div className="space-y-3">
          <ClipboardList size={32} />
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic">Set New Password</h1>
          <p className="text-[10px] text-zinc-400">Enter your new account password below.</p>
        </div>
        {done ? (
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center space-y-2">
            <p className="text-[11px] font-black uppercase text-emerald-400">Password updated!</p>
            <p className="text-[9px] text-zinc-400">Redirecting to login...</p>
          </div>
        ) : !ready ? (
          <div className="space-y-4">
            <p className="text-[10px] text-zinc-400 animate-pulse">Verifying reset link...</p>
            <p className="text-[9px] text-zinc-400">Link expired? <button onClick={() => router.push("/order-processor/login")} className="text-white underline">Go back</button></p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">New Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} className="w-full bg-transparent border-b border-white/10 py-4 px-4 text-sm outline-none focus:border-white font-mono pr-12"
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} className="w-full bg-transparent border-b border-white/10 py-4 px-4 text-sm outline-none focus:border-white font-mono pr-12"
                  value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                  {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button disabled={loading} className="w-full bg-white text-black py-4 text-[11px] sm:text-[10px] font-bold uppercase tracking-widest disabled:opacity-50">
              {loading ? "Updating..." : "Set New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
