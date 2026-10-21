'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  WalletCards,
  Users,
  Shield,
  CreditCard,
  Tags,
  Receipt,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, activeAccount } = useAuth();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Active Workspace Overview */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white shadow-xl shadow-indigo-600/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Active Financial Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {activeAccount ? activeAccount.name : 'Loading Workspace...'}
          </h1>

          <p className="mt-2 text-indigo-100 text-base sm:text-lg">
            Welcome, <span className="font-semibold text-white">{user?.displayName}</span>! You are viewing this workspace as{' '}
            <span className="font-semibold text-amber-300">
              {activeAccount?.role === 'ADMINISTRATOR' ? 'Administrator' : 'Member'}
            </span>
            .
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/settings/members"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-semibold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Manage Workspace Members</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Workspace Foundation Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Multi-Provider Authentication */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Multi-Provider Auth Active</h2>
          <p className="text-sm text-slate-500 mt-1">
            Protected with OWASP-recommended Argon2id password hashing and Google OAuth 2.0 integration.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            Session Status: Secure (HttpOnly JWT)
          </div>
        </div>

        {/* Card 2: Workspace Isolation */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
            <WalletCards className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Multi-Tenant Context</h2>
          <p className="text-sm text-slate-500 mt-1">
            Data is strictly isolated per account. You can seamlessly switch between workspaces in the top header.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-500">
            Role: {activeAccount?.role}
          </div>
        </div>

        {/* Card 3: Collaborative Sharing */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Collaborative Workspaces</h2>
          <p className="text-sm text-slate-500 mt-1">
            Invite family members or financial partners by email to co-manage expenses and track invoices.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/settings/members"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              <span>Invite collaborators</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Domain Modules Placeholder */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Ready for Financial Modules</h2>
        <p className="text-sm text-slate-500 mt-1">
          The foundation (F01) is complete. The system is ready to receive domain entities:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex items-start space-x-3">
            <Tags className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-800">F02. Categories</p>
              <p className="text-xs text-slate-500 mt-0.5">Custom category tags with icons and colors</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex items-start space-x-3">
            <CreditCard className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-800">F03. Credit Cards</p>
              <p className="text-xs text-slate-500 mt-0.5">Card brands, limits, closing and due dates</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex items-start space-x-3">
            <Receipt className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-800">F04. Expense Engine</p>
              <p className="text-xs text-slate-500 mt-0.5">Installments and non-repeating decimal rounding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
