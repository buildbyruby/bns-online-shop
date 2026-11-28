import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  searchParams: Promise<{ ids?: string }>;
}

async function getProducts(ids: string[]) {
  if (!ids.length) return [];
  const { data } = await supabase
    .from("products")
    .select("*, categories(name)")
    .in("id", ids);
  return ids.map((id) => data?.find((p: any) => p.id === id)).filter(Boolean);
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const ids = params.ids ? params.ids.split(",").filter(Boolean) : [];
  const products = await getProducts(ids);
  const count = products.length;
  const first = products[0] as any;

  const title = count === 1
    ? `${first?.name} — KSH ${Number(first?.price).toLocaleString()} | BNS Shop`
    : `BNS Catalog — ${count} item${count !== 1 ? "s" : ""}`;

  const description = count === 1
    ? `${first?.name} available now. Reply to order! 🛍️`
    : products.slice(0, 3).map((p: any) => `${p.name} KSH ${Number(p.price).toLocaleString()}`).join(" · ") + (count > 3 ? ` +${count - 3} more` : "") + " — Tap to view";

  const image = first?.image_url || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: first?.name }] : [],
      type: "website",
      siteName: "BNS Shop",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function CatalogSharePage({ searchParams }: Props) {
  const params = await searchParams;
  const ids = params.ids ? params.ids.split(",").filter(Boolean) : [];
  const products = await getProducts(ids);

  if (!products.length) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#555", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>No products found</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "0 0 60px 0" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "520px", margin: "0 auto" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.5px", textTransform: "uppercase" }}>
            BNS<span style={{ color: "#555" }}>.Shop</span>
          </div>
          <div style={{ fontSize: "9px", color: "#555", letterSpacing: "0.3em", textTransform: "uppercase", marginTop: "2px" }}>Product Catalogue</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", padding: "6px 14px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {products.length} item{products.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Products */}
      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {products.map((p: any) => (
          <div key={p.id} style={{ display: "flex", gap: "0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", overflow: "hidden" }}>
            {/* Image */}
            <div style={{ width: "110px", minHeight: "110px", flexShrink: 0, position: "relative", background: "rgba(255,255,255,0.05)" }}>
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  style={{ width: "110px", height: "110px", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{ width: "110px", height: "110px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>📦</div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px" }}>
              {p.categories?.name && (
                <div style={{ fontSize: "8px", fontWeight: 800, color: "#555", textTransform: "uppercase", letterSpacing: "0.25em" }}>{p.categories.name}</div>
              )}
              <div style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.2px", lineHeight: 1.2 }}>{p.name}</div>
              {p.description && (
                <div style={{ fontSize: "11px", color: "#666", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</div>
              )}
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#34d399", marginTop: "4px" }}>
                KSH {Number(p.price).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "0 16px" }}>
        <div style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: "20px", padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "18px", marginBottom: "6px" }}>🛍️</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#34d399", marginBottom: "4px" }}>Interested? Get in touch</div>
          <div style={{ fontSize: "11px", color: "#666", lineHeight: 1.5 }}>Reply to the message you received to place your order.</div>
        </div>
      </div>
    </div>
  );
}