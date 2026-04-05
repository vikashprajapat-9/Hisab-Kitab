import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();
      if (data) {
        setUser(data);
      } else {
        // Profile may not exist yet (trigger may be slow) — create it
        const name = supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "User";
        const { data: inserted } = await supabase
          .from("users")
          .upsert({ id: supabaseUser.id, name, email: supabaseUser.email! })
          .select()
          .single();
        if (inserted) setUser(inserted);
      }
    } catch {}
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (sbUser) await loadUserProfile(sbUser);
  }, [loadUserProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Sign up failed — please try again.");
    // Upsert profile in case trigger is slow
    await supabase.from("users").upsert({ id: data.user.id, name, email }).select().single();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    if (data) setUser(data);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      session, user, isLoading,
      isAuthenticated: !!session && !!user,
      signUp, signIn, signOut, updateProfile, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
