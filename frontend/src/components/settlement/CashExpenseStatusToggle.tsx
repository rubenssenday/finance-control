'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { CheckCircle2, Clock, Loader2, CreditCard } from 'lucide-react';

export interface CashExpenseItem {
  id: string;
  description: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID';
  displayStatus?: 'PAID' | 'PENDING' | 'OVERDUE';
  daysOverdue?: number;
  dueDate: string;
  updatedAt: string;
  paidAt?: string | null;
}

interface CashExpenseStatusToggleProps {
  expense: CashExpenseItem;
  onStatusChange?: (updatedExpense: any) => void;
  onError?: (errorMessage: string) => void;
}

export const CashExpenseStatusToggle: React.FC<CashExpenseStatusToggleProps> = ({
  expense,
  onStatusChange,
  onError,
}) => {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<
    'PAID' | 'PENDING' | 'OVERDUE' | null
  >(null);

  // If this is a credit card expense, direct settlement is prohibited
  if (expense.paymentMethod === 'CREDIT_CARD') {
    return (
      <div className="relative group/cc inline-block">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed select-none">
          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {expense.paymentStatus === 'PAID' ? t('dashboard.creditCardsBlock.invoicePaid') : t('dashboard.creditCardsBlock.invoiceOpen')}
          </span>
        </div>
      </div>
    );
  }

  const currentDisplay =
    optimisticStatus ??
    expense.displayStatus ??
    (expense.paymentStatus === 'PAID' ? 'PAID' : 'PENDING');

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating) return;

    const previousOptimistic = optimisticStatus;
    const nextStatus = currentDisplay === 'PAID' ? 'PENDING' : 'PAID';

    // Optimistically update UI
    setOptimisticStatus(nextStatus);
    setIsUpdating(true);

    try {
      const response = await apiClient<{ status: string; data: any }>(
        `/expenses/${expense.id}/settle`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: nextStatus,
            expectedUpdatedAt: expense.updatedAt,
          }),
        },
      );

      setOptimisticStatus(null);
      if (onStatusChange) {
        onStatusChange(response.data);
      }
    } catch (err: any) {
      // Revert optimistic state on failure
      setOptimisticStatus(previousOptimistic);

      if (err.code === 'CONCURRENT_STATUS_MUTATION') {
        const msg = t('settlement.concurrentStatusError');
        if (onError) onError(msg);
        if (err.currentData && onStatusChange) {
          onStatusChange(err.currentData);
        }
      } else {
        const msg = err.message || t('settlement.updateStatusError');
        if (onError) onError(msg);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (currentDisplay === 'PAID') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isUpdating}
        title={t('expenses.status.PAID')}
        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/90 active:scale-95 transition-all shadow-xs cursor-pointer select-none group/toggle"
      >
        {isUpdating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover/toggle:scale-110 transition-transform" />
        )}
        <span>{t('expenses.status.PAID')}</span>
      </button>
    );
  }

  if (currentDisplay === 'OVERDUE') {
    const days = expense.daysOverdue && expense.daysOverdue > 0 ? expense.daysOverdue : 1;
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isUpdating}
        title={t('expenses.status.OVERDUE')}
        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50/80 text-rose-700 border border-rose-300 hover:bg-rose-100 active:scale-95 transition-all shadow-xs cursor-pointer select-none group/toggle"
      >
        {isUpdating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
        ) : (
          <span className="relative flex h-2 w-2 mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
        <span>{t('expenses.status.OVERDUE')} ({days}d)</span>
      </button>
    );
  }

  // PENDING state
  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isUpdating}
      title={t('expenses.status.PENDING')}
      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100/90 active:scale-95 transition-all shadow-xs cursor-pointer select-none group/toggle"
    >
      {isUpdating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-amber-600 group-hover/toggle:scale-110 transition-transform" />
      )}
      <span>{t('expenses.status.PENDING')}</span>
    </button>
  );
};
