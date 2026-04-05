export type SplitType = "equal" | "exact" | "percentage" | "full";
export type GroupCategory =
  | "home"
  | "trip"
  | "food"
  | "entertainment"
  | "work"
  | "other";
export type ThemeMode = "light" | "dark" | "system";

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isCurrentUser?: boolean;
}

export interface GroupMember {
  userId: string;
  user: User;
  balance: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  category: GroupCategory;
  currency: string;
  members: GroupMember[];
  createdAt: string;
  createdBy: string;
  isSettled: boolean;
  totalExpenses: number;
  imageUri?: string;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
  percentage?: number;
  isPaid?: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string[];
  paidAmounts: Record<string, number>;
  splitType: SplitType;
  splits: ExpenseSplit[];
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  category?: string;
  notes?: string;
  receiptUri?: string;
}

export interface Settlement {
  id: string;
  groupId?: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  createdAt: string;
  note?: string;
  isSettled: boolean;
}

export interface ActivityItem {
  id: string;
  type: "expense_added" | "expense_updated" | "expense_deleted" | "settlement" | "member_added" | "group_created";
  userId: string;
  groupId?: string;
  expenseId?: string;
  settlementId?: string;
  description: string;
  amount?: number;
  currency?: string;
  createdAt: string;
}

export interface FriendBalance {
  userId: string;
  user: User;
  totalBalance: number;
  currency: string;
  groupBreakdown: {
    groupId: string;
    groupName: string;
    balance: number;
  }[];
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export const CURRENCIES: CurrencyRate[] = [
  { code: "USD", name: "US Dollar", symbol: "$", rate: 1 },
  { code: "EUR", name: "Euro", symbol: "€", rate: 0.92 },
  { code: "GBP", name: "British Pound", symbol: "£", rate: 0.79 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 83.5 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 149.8 },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", rate: 1.36 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", rate: 1.53 },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr", rate: 0.89 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", rate: 7.24 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", rate: 1.34 },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", rate: 7.82 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", rate: 1325 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", rate: 4.97 },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", rate: 17.1 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", rate: 3.67 },
];

export const GROUP_CATEGORIES: { value: GroupCategory; label: string; icon: string }[] = [
  { value: "home", label: "Home", icon: "home" },
  { value: "trip", label: "Trip", icon: "map" },
  { value: "food", label: "Food", icon: "coffee" },
  { value: "entertainment", label: "Entertainment", icon: "film" },
  { value: "work", label: "Work", icon: "briefcase" },
  { value: "other", label: "Other", icon: "grid" },
];
