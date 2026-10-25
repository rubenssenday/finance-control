'use client';

import React from 'react';
import { SummaryMetrics } from './dashboard-types';
import { useTranslation } from '@/lib/i18n/i18n-context';
import {
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface FinancialSummaryBarProps {
  summary: SummaryMetrics;
  isLoading?: boolean;
}

export function FinancialSummaryBar({
  summary,
  isLoading,
}: FinancialSummaryBarProps) {
  const { t, formatCurrency } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200/80 p-5" />
        ))}
      </div>
    );
  }

  const isPositiveBalance = summary.netBalance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Projected Income */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {t('dashboard.summary.totalIncome')}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-2 tracking-tight">
          {formatCurrency(summary.totalIncome)}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {summary.incomeCount} {summary.incomeCount === 1 ? t('common.item') : t('common.items')}
        </p>
      </div>

      {/* 2. Total Committed Expenses */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {t('dashboard.summary.totalCommitted')}
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
          {formatCurrency(summary.totalExpenses)}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {summary.expenseCount} {summary.expenseCount === 1 ? t('common.item') : t('common.items')}
        </p>
      </div>

      {/* 3. Total Paid to Date */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            {t('dashboard.summary.totalPaid')}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-2 tracking-tight">
          {formatCurrency(summary.totalPaid)}
        </p>
        <div className="flex items-center space-x-1 text-xs text-emerald-600 mt-1">
          <span>{t('dashboard.creditCardsBlock.invoicePaid')}</span>
        </div>
      </div>

      {/* 4. Total Pending */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            {t('dashboard.summary.totalPending')}
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-black text-amber-600 mt-2 tracking-tight">
          {formatCurrency(summary.totalPending)}
        </p>
        <div className="flex items-center space-x-1 text-xs text-amber-600 mt-1">
          <span>{t('expenses.status.PENDING')}</span>
        </div>
      </div>

      {/* 5. Projected Net Balance */}
      <div
        className={`rounded-2xl p-5 border shadow-xs transition-all group ${
          isPositiveBalance
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200/80'
            : 'bg-gradient-to-br from-rose-50 to-red-50/50 border-rose-200/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${
              isPositiveBalance ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            {t('dashboard.summary.netBalance')}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              isPositiveBalance
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {isPositiveBalance ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
          </div>
        </div>
        <p
          className={`text-xl sm:text-2xl font-black mt-2 tracking-tight ${
            isPositiveBalance ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {formatCurrency(summary.netBalance)}
        </p>
        <p
          className={`text-xs mt-1 font-semibold ${
            isPositiveBalance ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {isPositiveBalance ? t('dashboard.summary.surplus') : t('dashboard.summary.deficit')}
        </p>
      </div>
    </div>
  );
}
