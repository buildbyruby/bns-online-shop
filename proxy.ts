import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/server";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin/dashboard",
  order_processor: "/order-processor/dashboard",
  sales: "/sales/dashboard",
};

function matchesRole(pathname: string, role: string | null) {
  if (pathname.startsWith("/admin/dashboard")) return role === "admin";
  if (pathname.startsWith("/order-processor/dashboard")) return role === "order_processor";
  if (pathname.startsWith("/sales/dashboard")) return role === "sales";
  if (pathname.startsWith("/dashboard/admin")) return role === "admin";
  if (pathname.startsWith("/dashboard/order-processor")) return role === "order_processor";
  if (pathname.startsWith("/dashboard/sales")) return role === "sales";
  return true;
}

function loginPathFor(pathname: string) {
  if (pathname.startsWith("/admin")) return "/admin/login";
  if (pathname.startsWith("/order-processor")) return "/order-processor/login";
  if (pathname.startsWith("/sales")) return "/sales/login";
  return "/login";
}

const PROTECTED_PREFIXES = [
  "/admin/dashboard",
  "/order-processor/dashboard",
  "/sales/dashboard",
  "/dashboard",
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const response = NextResponse.next();
  const supabase = createProxyClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = loginPathFor(pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? null;

  if (!matchesRole(pathname, role)) {
    const url = request.nextUrl.clone();
    url.pathname = role && ROLE_HOME[role] ? ROLE_HOME[role] : "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/order-processor/dashboard/:path*",
    "/sales/dashboard/:path*",
    "/dashboard/:path*",
  ],
};

