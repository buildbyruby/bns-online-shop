"use client";
import { Shield, BadgeDollarSign, ArrowRight, UserPlus, ClipboardList } from "lucide-react";
import Link from "next/link";

export default function EntryGate() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-4 py-10 font-sans">
      <div className="w-full max-w-5xl space-y-8 sm:space-y-12 text-center">

        <div className="space-y-3">
          <img src="/logo.png" alt="BNS Logo" className="mx-auto mb-2 h-14 sm:h-20 w-auto" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter italic uppercase">BNS Systems</h1>
          <p className="text-[10px] text-zinc-500 tracking-[0.4em] uppercase">Select Your Role</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: Shield,
              title: "Admin",
              desc: "Global Control • Inventory • Analytics",
              loginHref: "/admin/login",
              loginLabel: "Login to Admin",
              registerHref: "/admin/signup",
              registerLabel: "Register New Admin",
            },
            {
              icon: BadgeDollarSign,
              title: "Salesperson",
              desc: "Customer CRM • Habit Tracking • Sales Entry",
              loginHref: "/sales/login",
              loginLabel: "Login to Sales",
              registerHref: "/sales/signup",
              registerLabel: "Register New Salesperson",
            },
            {
              icon: ClipboardList,
              title: "Order Processor",
              desc: "Staff Activity • Sales Tracking • Orders",
              loginHref: "/order-processor/login",
              loginLabel: "Login to Processor",
              registerHref: "/order-processor/signup",
              registerLabel: "Register New Processor",
            },
          ].map((card) => (
            <div key={card.title} className="group p-6 sm:p-8 md:p-10 border border-white/10 bg-zinc-900/50 hover:bg-white hover:text-black transition-all duration-500 text-left space-y-6 flex flex-col justify-between active:scale-[0.98]">
              <div>
                <card.icon size={32} strokeWidth={1} className="mb-4 sm:mb-6" />
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{card.title}</h2>
                <p className="text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100 mt-1 leading-relaxed">{card.desc}</p>
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10 group-hover:border-black/10">
                <Link href={card.loginHref} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:underline py-1">
                  {card.loginLabel} <ArrowRight size={13} />
                </Link>
                <Link href={card.registerHref} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-400 hover:text-black transition-colors py-1">
                  {card.registerLabel} <UserPlus size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
