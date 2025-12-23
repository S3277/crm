import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LeadStatus =
  | 'hot'
  | 'warm'
  | 'cold'
  | 'uninterested'
  | 'qualified'
  | 'unqualified'
  | 'called'
  | 'texted'
  | 'interested'
  | 'not_interested';

export type CallResult = 'appointment_booked' | 'unsuccessful' | null;

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
  company: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  lead_type: 'inbound' | 'outbound';
  source_channel: 'cold_call' | 'inbound_call' | 'web_form' | 'email_campaign' | 'manual' | 'other' | null;
  call_result: CallResult;
  qualified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trigger {
  id: string;
  user_id: string;
  start_calling: boolean;
  start_qualifying: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface AutomationLog {
  id: string;
  action_type: 'start_calling' | 'start_qualifying' | 'stop_calling' | 'stop_qualifying';
  status: 'success' | 'failed';
  user_id: string | null;
  details: Record<string, any>;
  created_at: string;
}
