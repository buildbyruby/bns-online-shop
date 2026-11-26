import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

async function getProduct(slug: string) {
  const { data } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found | BNS Systems" };

  const base = product.product_type === "B2B" ? Number(product.b2b_price || product.price || 0) : Number(product.b2c_price || product.price || 0);
  const disc = product.product_type === "B2B" ? Number(product.b2b_discount_price || 0) : Number(product.b2c_discount_price || 0);
  const price = disc > 0 ? disc : base;
  const priceLabel = `KSH ${price.toLocaleString()}`;
  const description = `${priceLabel}${product.categories?.name ? ` · ${product.categories.name}` : ""} — Available at BNS Systems`;
  const image = product.image_url || `${SITE_URL}/favicon.ico`;
  const url = `${SITE_URL}/p/${product.slug || product.id}`;

  return {
    title: `${product.name} — ${priceLabel} | BNS Systems`,
    description,
    openGraph: {
      title: product.name,
      description,
      url,
      siteName: "BNS Systems",
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <p className="text-sm font-black uppercase tracking-widest text-zinc-400">Product not found</p>
      </div>
    );
  }

  const isB2B = product.product_type === "B2B";
  const base = isB2B ? Number(product.b2b_price || product.price || 0) : Number(product.b2c_price || product.price || 0);
  const disc = isB2B ? Number(product.b2b_discount_price || 0) : Number(product.b2c_discount_price || 0);

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-72 object-cover" />
        ) : (
          <div className="w-full h-72 bg-white/5" />
        )}
        <div className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <img src="/logo.png" alt="BNS" className="w-6 h-6 object-contain" />
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">BNS Systems</p>
          </div>
          <h1 className="text-2xl font-black uppercase italic">{product.name}</h1>
          {product.categories?.name && <p className="text-[10px] text-zinc-400 uppercase mt-1">{product.categories.name}</p>}
          <div className="mt-4">
            {disc > 0 ? (
              <div className="flex items-baseline gap-3">
                <span className="text-zinc-500 line-through text-sm font-bold">KSH {base.toLocaleString()}</span>
                <span className="text-emerald-400 font-black text-3xl">KSH {disc.toLocaleString()}</span>
              </div>
            ) : (
              <span className="text-emerald-400 font-black text-3xl">KSH {base.toLocaleString()}</span>
            )}
          </div>
          <a href="https://wa.me/254702216591" target="_blank" className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-bold hover:underline">📲 Order via WhatsApp: 0702216591</a>
        </div>
      </div>
    </div>
  );
}
