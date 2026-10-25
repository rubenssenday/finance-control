'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { AccountSwitcher } from './AccountSwitcher';
import { LocaleSwitcher } from './LocaleSwitcher';
import { WalletCards, LogOut, Users, Settings, Tags, CreditCard, Receipt, TrendingUp } from 'lucide-react';

export function AppHeader() {
  const { user, activeAccount, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Account Switcher */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2 text-indigo-600 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <WalletCards className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight hidden sm:inline-block">
              {t('common.appName')}
            </span>
          </Link>

          <div className="h-5 w-px bg-slate-200" />

          {/* Account Context Switcher */}
          <AccountSwitcher />
        </div>

        {/* User Navigation Actions */}
        <div className="flex items-center space-x-3">
          {activeAccount && (
            <>
              <Link
                href="/expenses"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Receipt className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">{t('nav.expenses')}</span>
              </Link>

              <Link
                href="/incomes"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="hidden md:inline">{t('nav.incomes')}</span>
              </Link>

              <Link
                href="/cards"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">{t('nav.cards')}</span>
              </Link>

              <Link
                href="/settings/categories"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Tags className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">{t('nav.categories')}</span>
              </Link>

              <Link
                href="/settings/members"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">{t('nav.members')}</span>
              </Link>
            </>
          )}

          {/* Locale Switcher */}
          <LocaleSwitcher />

          {user && (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
              <div className="flex items-center space-x-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-semibold text-slate-700 hidden lg:inline">
                  {user.displayName}
                </span>
              </div>

              <button
                onClick={logout}
                title={t('nav.logout')}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
