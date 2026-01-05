export type AdminRole = 'admin' | 'super_admin' | 'staff' | 'investor';

export interface InvestorAccount {
  id: string;
  user_id: string;
  deposit_amount: number;
  target_revenue: number;
  current_revenue: number;
  status: 'active' | 'completed' | 'withdrawn';
  joined_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  // Optional relations
  investor_accounts?: InvestorAccount;
}

export interface Booking {
  id: string;
  phone_number: string;
  name: string | null;
  email: string | null;
  studio: string;
  session_type: string | null;
  session_details: string | null;
  group_size: number;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  whatsapp_reminder_sent_at: string | null;
  is_prompt_payment: boolean;
  payment_status: "pending" | "verified" | "failed";
  investor_id?: string | null; 
}
