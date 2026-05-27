"use client";
import { Shield, BadgeDollarSign, ArrowRight, UserPlus, ClipboardList } from "lucide-react";
import Link from "next/link";

export default function EntryGate() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white p-6 font-sans">
      <div className="w-full max-w-5xl space-y-12 text-center">
        <div className="space-y-4">
          <img src="/logo.png" alt="BNS Logo" className="mx-auto mb-4 h-24 w-auto" />
          <h1 className="text-5xl font-black tracking-tighter italic uppercase">BNS Systems</h1>
          <p className="text-xs text-zinc-500 tracking-[0.5em] uppercase">Select Your Role</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Admin */}
          <div className="group p-10 border border-white/10 bg-zinc-900/50 hover:bg-white hover:text-black transition-all duration-500 text-left space-y-8 flex flex-col justify-between">
            <div>
              <Shield size={40} strokeWidth={1} className="mb-6" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Admin</h2>
              <p className="text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100 mt-1">Global Control • Inventory • Analytics</p>
            </div>
            <div className="space-y-4 pt-6 border-t border-white/10 group-hover:border-black/10">
              <Link href="/admin/login" className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] hover:underline">
                Login to Admin <ArrowRight size={14} />
              </Link>
              <Link href="/admin/signup" className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-400 hover:text-black transition-colors">
                Register New Admin <UserPlus size={14} />
              </Link>
            </div>
          </div>

          {/* Salesperson */}
          <div className="group p-10 border border-white/10 bg-zinc-900/50 hover:bg-white hover:text-black transition-all duration-500 text-left space-y-8 flex flex-col justify-between">
            <div>
              <BadgeDollarSign size={40} strokeWidth={1} className="mb-6" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Salesperson</h2>
              <p className="text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100 mt-1">Customer CRM • Habit Tracking • Sales Entry</p>
            </div>
            <div className="space-y-4 pt-6 border-t border-white/10 group-hover:border-black/10">
              <Link href="/sales/login" className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] hover:underline">
                Login to Sales <ArrowRight size={14} />
              </Link>
              <Link href="/sales/signup" className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-400 hover:text-black transition-colors">
                Register New Salesperson <UserPlus size={14} />
              </Link>
            </div>
          </div>

          {/* Order Processor */}
          <div className="group p-10 border border-white/10 bg-zinc-900/50 hover:bg-white hover:text-black transition-all duration-500 text-left space-y-8 flex flex-col justify-between">
            <div>
              <ClipboardList size={40} strokeWidth={1} className="mb-6" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Order Processor</h2>
              <p className="text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100 mt-1">Staff Activity • Sales Tracking • Orders</p>
            </div>
            <div className="space-y-4 pt-6 border-t border-white/10 group-hover:border-black/10">
              <Link href="/order-processor/login" className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] hover:underline">
                Login to Processor <ArrowRight size={14} />
              </Link>
              <Link href="/order-processor/signup" className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-400 hover:text-black transition-colors">
                Register New Processor <UserPlus size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
