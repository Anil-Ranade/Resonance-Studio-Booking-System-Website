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
    return null;
  }

  const supabase = supabaseAdmin();
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    return null;
  }

  return { user, adminUser };
}


// GET /api/admin/investors/[id] - Get specific investor details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = supabaseAdmin();

  // Determine if valid viewer (Admins or the Investor themselves)
  if (admin.adminUser.role !== 'admin' && admin.adminUser.role !== 'super_admin') {
      if (admin.adminUser.id !== id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
  }

  const { data: investor, error } = await supabase
    .from("admin_users")
    .select(`
      *,
      investor_accounts (*)
    `)
    .eq("id", id)
    .single();

  if (error || !investor) {
    return NextResponse.json({ error: "Investor not found" }, { status: 404 });
  }

  return NextResponse.json({ investor });
}

// PATCH /api/admin/investors/[id] - Update investor status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    // Only admins can update investor status
    if (admin.adminUser.role !== 'admin' && admin.adminUser.role !== 'super_admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  
    const { id } = await params;
    
    try {
        const body = await request.json();
        const { status } = body; // 'active', 'completed', 'withdrawn'

        if (!status) {
            return NextResponse.json({ error: "Missing status" }, { status: 400 });
        }

        const supabase = supabaseAdmin();

        const { data: account, error } = await supabase
            .from("investor_accounts")
            .update({ 
                status, 
                updated_at: new Date().toISOString(),
                ...(status === 'completed' || status === 'withdrawn' ? { completed_at: new Date().toISOString() } : {})
             })
            .eq("user_id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Log
        await supabase.from("audit_logs").insert({
            admin_id: admin.user.id,
            action: "update",
            entity_type: "investor_account",
            entity_id: id,
            new_data: { status }
        });

        return NextResponse.json({ success: true, account });

    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
