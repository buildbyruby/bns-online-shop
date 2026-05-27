"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Fetch role and redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "admin") {
      router.push("/dashboard/admin");
    } else if (profile?.role === "order_processor") {
      router.push("/dashboard/order-processor");
    } else {
      router.push("/dashboard/sales");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8 glass-card p-10 animate-fade-in">
        <div className="text-center">
          <h1 className="text-4xl font-light tracking-tighter text-white">BNS ONLINE SHOP</h1>
          <p className="mt-2 text-sm text-muted">Enter credentials to access the ecosystem</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              required
              className="w-full bg-black border border-border px-4 py-3 rounded-xl focus:outline-none focus:border-white transition-all text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full bg-black border border-border px-4 py-3 rounded-xl focus:outline-none focus:border-white transition-all text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2">
            {loading ? "Authenticating..." : <><LogIn size={18} /><span>Access System</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}
