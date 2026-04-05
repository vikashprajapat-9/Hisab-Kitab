# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### SplitEase - Expense Splitter (Mobile App)
- **Directory**: `artifacts/splitwise-app/`
- **Type**: Expo (React Native) mobile app
- **Preview Path**: `/`

#### Features
- Phone number + OTP authentication
- Groups management with categories and multi-currency support
- Expense tracking with 4 split types: Equal, Exact amounts, Percentage, Full (one person owes)
- Friends management with balance tracking
- Activity feed for all group transactions
- Debt simplification algorithm (minimize transactions)
- Settlement recording
- Dark/Light/System theme support
- QR code for adding friends
- Invite via link/WhatsApp

#### Key Files
- `app/_layout.tsx` — Root layout with all providers (Auth, Theme, Data)
- `app/(auth)/login.tsx` — Phone + OTP + Name auth flow
- `app/(tabs)/index.tsx` — Groups tab with filters
- `app/(tabs)/friends.tsx` — Friends tab with balances
- `app/(tabs)/activity.tsx` — Activity feed
- `app/(tabs)/account.tsx` — Settings and profile
- `app/group/[id].tsx` — Group detail with expenses, balances, settle up tabs
- `app/add-expense/[groupId].tsx` — Add expense with split type selector
- `app/settle/[groupId].tsx` — Settlement recording
- `context/AuthContext.tsx` — Authentication state (AsyncStorage)
- `context/DataContext.tsx` — All data: groups, expenses, settlements, friends
- `context/ThemeContext.tsx` — Theme preference
- `constants/colors.ts` — Design tokens (light + dark)
- `types/index.ts` — All TypeScript types + CURRENCIES, GROUP_CATEGORIES constants
