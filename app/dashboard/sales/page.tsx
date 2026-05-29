"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, Briefcase, User, Phone, MapPin, Save, Star } from "lucide-react";

export default function SalesDashboard() {
  const [custType, setCustType] = useState<"B2C" | "B2B">("B2C");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", contact: "", phone: "", address: "", preferences: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      type: custType,
      customer_name: custType === "B2C" ? formData.name : null,
      business_name: custType === "B2B" ? formData.name : null,
      contact_person: custType === "B2B" ? formData.contact : null,
      phone: formData.phone,
      address: formData.address,
      preferences: [formData.preferences],
      created_by: user?.id,
    };

    const { error } = await supabase.from("customers").insert([payload]);
    if (error) alert(error.message);
    else {
      alert("Customer Saved Successfully");
      setFormData({ name: "", contact: "", phone: "", address: "", preferences: "" });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-10 animate-fade-in">
      <header>
        <h2 className="text-muted font-mono text-xs uppercase tracking-[0.3em]">Sales Command</h2>
        <h1 className="text-4xl font-light tracking-tight">Client Intelligence</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form Section */}
        <div className="lg:col-span-2 glass-card p-8 space-y-6">
          <div className="flex gap-2 p-1 bg-white/5 rounded-full w-fit">
            <button 
              onClick={() => setCustType("B2C")}
              className={`px-6 py-2 rounded-full text-sm transition-all ${custType === "B2C" ? "bg-white text-black" : "text-muted"}`}
            >
              Individual (B2C)
            </button>
            <button 
              onClick={() => setCustType("B2B")}
              className={`px-6 py-2 rounded-full text-sm transition-all ${custType === "B2B" ? "bg-white text-black" : "text-muted"}`}
            >
              Business (B2B)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted uppercase">Name</label>
                <input 
                  required
                  className="w-full bg-black border border-white/10 p-3 rounded-xl focus:border-white outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={custType === "B2C" ? "Customer Full Name" : "Company Name"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted uppercase">Phone</label>
                <input 
                  required
                  className="w-full bg-black border border-white/10 p-3 rounded-xl focus:border-white outline-none transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            {custType === "B2B" && (
              <div className="space-y-2">
                <label className="text-xs text-muted uppercase">Contact Person</label>
                <input 
                  className="w-full bg-black border border-white/10 p-3 rounded-xl focus:border-white outline-none transition-all"
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-muted uppercase">Smart Notes & Habits</label>
              <textarea 
                className="w-full bg-black border border-white/10 p-3 rounded-xl focus:border-white outline-none transition-all min-h-[100px]"
                placeholder="Example: Buys Bakery items every Tuesday morning..."
                value={formData.preferences}
                onChange={(e) => setFormData({...formData, preferences: e.target.value})}
              />
            </div>

            <button disabled={loading} className="w-full btn-primary py-4 flex items-center justify-center gap-2">
              <Save size={20} /> {loading ? "Processing..." : "Save Customer Profile"}
            </button>
          </form>
        </div>

        {/* Sidebar: Smart Insights */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-l-4 border-l-white">
            <h3 className="flex items-center gap-2 text-sm font-medium mb-4">
              <Star size={16} className="text-zinc-400" /> AI Reminder
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Based on 2030 patterns, 4 B2B clients in the **Bakery** sector are due for a follow-up this afternoon.
            </p>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Personal Sales</span>
                <span>$1,240.00</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">New Leads</span>
                <span>12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}