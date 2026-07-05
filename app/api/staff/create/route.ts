import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE;

const TABLE_FOR_ROLE: Record<string, string> = {
  admin: "admins",
  order_processor: "order_processors",
  sales: "sales_force",
};

export async function POST(request: Request) {
  const body = await request.json();
  const { role, inviteCode, name, phone, email, password, region } = body ?? {};

  if (!role || !TABLE_FOR_ROLE[role]) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }
  if (!name || !phone || !email || !password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (role === "admin") {
    if (!ADMIN_INVITE_CODE || inviteCode !== ADMIN_INVITE_CODE) {
      return NextResponse.json({ error: "Invalid invite code." }, { status: 403 });
    }
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, phone_number: phone, role },
  });

  let userId = created?.user?.id;

  if (createError) {
    if (!createError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }
    const { data: existing } = await admin.auth.admin.listUsers();
    const match = existing.users.find((u) => u.email === email);
    if (!match) {
      return NextResponse.json({ error: "Account exists but could not be resolved." }, { status: 400 });
    }
    userId = match.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "User creation failed." }, { status: 500 });
  }

  const { data: existingProfile } = await admin.from("profiles").select("role").eq("id", userId).single();
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: userId, full_name: name, role: existingProfile?.role ?? role, is_active: true });
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: roleError } = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role", ignoreDuplicates: true });
  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  const staffPayload: Record<string, unknown> = { id: userId, name, phone, email };
  if (role === "sales") staffPayload.region = region ?? "Buruburu Phase 1";
  if (role === "sales") staffPayload.status = "active";

  // Sales staff can be pre-created by an admin via "Add Staff" before they
  // ever sign up themselves. That row has a random id with no auth account
  // attached yet, matched only by phone number. If we blindly upsert by id
  // here, we miss that row and try to insert a brand new one with the same
  // phone, which fails on the unique phone constraint. So for sales, look
  // for an existing row by phone first and claim it; only insert fresh if
  // no pre-created row exists.
  if (role === "sales") {
    const { data: existingByPhone } = await admin
      .from("sales_force")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existingByPhone) {
      const { error: claimError } = await admin
        .from("sales_force")
        .update({ id: userId, name, email, status: "active" })
        .eq("phone", phone);
      if (claimError) {
        return NextResponse.json({ error: claimError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await admin.from("sales_force").upsert(staffPayload, { onConflict: "id" });
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }
  } else {
    const { error: staffError } = await admin
      .from(TABLE_FOR_ROLE[role])
      .upsert(staffPayload, { onConflict: "id" });
    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
