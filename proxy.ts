import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/server";

function requiredRoleFor(pathname: string): string | null {
  if (pathname.startsWith("/admin/dashboard")) return "admin";
  if (pathname.startsWith("/order-processor/dashboard")) return "order_processor";
  if (pathname.startsWith("/sales/dashboard")) return "sales";
  if (pathname.startsWith("/dashboard/admin")) return "admin";
  if (pathname.startsWith("/dashboard/order-processor")) return "order_processor";
  if (pathname.startsWith("/dashboard/sales")) return "sales";
  return null;
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

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = new Set((roleRows ?? []).map((r) => r.role));
  const required = requiredRoleFor(pathname);

  if (required && !roles.has(required)) {
    const url = request.nextUrl.clone();
    url.pathname = loginPathFor(pathname);
    url.searchParams.set("denied", required);
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
