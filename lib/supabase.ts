import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  role: 'admin' | 'sales';
  is_active: boolean;
};

export type Customer = {
  id: string;
  type: 'B2B' | 'B2C';
  customer_name?: string;
  business_name?: string;
  contact_person?: string;
  phone: string;
  address?: string;
  preferences: any[];
  created_by: string;
};