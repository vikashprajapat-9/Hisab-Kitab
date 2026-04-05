-- ================================================
-- Hisab Kitab - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLES
-- ================================================

-- Users (profile linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend requests / friendships
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Groups
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  is_settled BOOLEAN NOT NULL DEFAULT FALSE,
  total_expenses NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  paid_by UUID NOT NULL REFERENCES public.users(id),
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'exact', 'percentage', 'full')),
  category TEXT NOT NULL DEFAULT 'other',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense splits (who owes how much)
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  percentage NUMERIC(6,2),
  UNIQUE(expense_id, user_id)
);

-- Settlements
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  settlement_id UUID REFERENCES public.settlements(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(14,2),
  currency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read profiles, only own profile can be updated
CREATE POLICY "Users can read all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Friends: can see own friend requests
CREATE POLICY "Users can see their friend requests" ON public.friends FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friend requests" ON public.friends FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can delete friend requests" ON public.friends FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Groups: only members can see groups
CREATE POLICY "Group members can see their groups" ON public.groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group members can update groups" ON public.groups FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()));
CREATE POLICY "Group creator can delete groups" ON public.groups FOR DELETE
  USING (auth.uid() = created_by);

-- Group members
CREATE POLICY "Members can see group membership" ON public.group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Members can insert group members" ON public.group_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_id AND user_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Members can update balances" ON public.group_members FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Members can remove themselves" ON public.group_members FOR DELETE
  USING (user_id = auth.uid());

-- Expenses: group members only
CREATE POLICY "Group members can see expenses" ON public.expenses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = expenses.group_id AND user_id = auth.uid()));
CREATE POLICY "Group members can create expenses" ON public.expenses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = expenses.group_id AND user_id = auth.uid()));
CREATE POLICY "Expense creator can update" ON public.expenses FOR UPDATE
  USING (created_by = auth.uid());
CREATE POLICY "Expense creator can delete" ON public.expenses FOR DELETE
  USING (created_by = auth.uid());

-- Expense splits
CREATE POLICY "Group members can see splits" ON public.expense_splits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.expenses e
    JOIN public.group_members gm ON gm.group_id = e.group_id
    WHERE e.id = expense_id AND gm.user_id = auth.uid()
  ));
CREATE POLICY "Group members can insert splits" ON public.expense_splits FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.expenses e
    JOIN public.group_members gm ON gm.group_id = e.group_id
    WHERE e.id = expense_id AND gm.user_id = auth.uid()
  ));
CREATE POLICY "Group members can update splits" ON public.expense_splits FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.expenses e
    JOIN public.group_members gm ON gm.group_id = e.group_id
    WHERE e.id = expense_id AND gm.user_id = auth.uid()
  ));
CREATE POLICY "Group members can delete splits" ON public.expense_splits FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.expenses e
    JOIN public.group_members gm ON gm.group_id = e.group_id
    WHERE e.id = expense_id AND gm.user_id = auth.uid()
  ));

-- Settlements: group members only
CREATE POLICY "Group members can see settlements" ON public.settlements FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR
    (group_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = settlements.group_id AND user_id = auth.uid())));
CREATE POLICY "Users can create settlements" ON public.settlements FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- Activities
CREATE POLICY "Group members can see activities" ON public.activities FOR SELECT
  USING (user_id = auth.uid() OR
    (group_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = activities.group_id AND user_id = auth.uid())));
CREATE POLICY "Users can insert activities" ON public.activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at on expenses
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ================================================
-- REALTIME
-- ================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_splits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
