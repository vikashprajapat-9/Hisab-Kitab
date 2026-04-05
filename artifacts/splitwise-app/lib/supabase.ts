import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      friends: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          currency: string;
          created_by: string;
          is_settled: boolean;
          total_expenses: number;
          created_at: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          balance: number;
          joined_at: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          group_id: string;
          description: string;
          amount: number;
          currency: string;
          paid_by: string;
          split_type: "equal" | "exact" | "percentage" | "full";
          category: string;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          amount: number;
          percentage: number | null;
        };
      };
      settlements: {
        Row: {
          id: string;
          group_id: string | null;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          currency: string;
          note: string | null;
          created_at: string;
        };
      };
      activities: {
        Row: {
          id: string;
          type: string;
          user_id: string;
          group_id: string | null;
          expense_id: string | null;
          settlement_id: string | null;
          description: string;
          amount: number | null;
          currency: string | null;
          created_at: string;
        };
      };
    };
  };
};
