import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Verify admin token from Authorization header
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  
  // Create a client with the user's access token to verify it
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  
  if (error || !user) {
    console.error("[Admin Investors] Auth error:", error?.message);
    return null;
  }

  // Use admin client to check admin_users table
  const supabase = supabaseAdmin();
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    // Only super_admin or admin can manage investors
    .in("role", ["admin", "super_admin"])
    .single();

  if (adminError || !adminUser) {
    console.error("[Admin Investors] Admin check error:", adminError?.message);
    return null;
  }

  return { user, adminUser };
}

// GET /api/admin/investors - List all investors with their account stats
export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  // Fetch investors and their account details
  const { data: investors, error } = await supabase
    .from("admin_users")
    .select(`
      *,
      investor_accounts (*)
    `)
    .eq("role", "investor")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ investors });
}

// POST /api/admin/investors - Create a new investor (Admin User + Investor Account)
export async function POST(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password, name, phone, deposit_amount } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAuth.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
        // If user already exists, we might want to just add them as admin_user if not present
        // But for now, let's error out
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Create Admin User Entry (Role: investor)
    const { error: adminUserError } = await supabase
      .from("admin_users")
      .insert({
        id: userId,
        email,
        name,
        role: "investor",
        is_active: true,
      });

    if (adminUserError) {
        // Cleanup auth user?
        await supabaseAuth.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: adminUserError.message }, { status: 500 });
    }

    // 3. Create Investor Account
    const { data: investorAccount, error: investorError } = await supabase
      .from("investor_accounts")
      .insert({
        user_id: userId,
        deposit_amount: deposit_amount || 30000,
        target_revenue: 45000, // Hardcoded for now based on scheme
        current_revenue: 0,
        status: "active"
      })
      .select()
      .single();
    
    if (investorError) {
        // Cleanup
        await supabase.from("admin_users").delete().eq("id", userId);
        await supabaseAuth.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: investorError.message }, { status: 500 });
    }

    // 4. Log Action
    await supabase.from("audit_logs").insert({
        admin_id: admin.user.id,
        action: "create",
        entity_type: "investor",
        entity_id: userId,
        new_data: { email, name, role: "investor", account: investorAccount }
    });

    return NextResponse.json({ success: true, investor: { ...authData.user, investor_account: investorAccount } });

  } catch (error) {
    console.error("Create Investor Error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
