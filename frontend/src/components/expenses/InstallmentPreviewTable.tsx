import React from 'react';
import { Receipt } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/i18n-context';

export interface InstallmentPreviewItem {
  installmentNumber: number;
  amount: number;
  invoiceMonth: number;
  invoiceYear: number;
}

interface InstallmentPreviewTableProps {
  totalAmount: number;
  installmentCount: number;
  closingDay: number;
  transactionDate: Date;
}

export function InstallmentPreviewTable({
  totalAmount,
  installmentCount,
  closingDay,
  transactionDate,
}: InstallmentPreviewTableProps) {
  const { t, formatCurrency, locale } = useTranslation();

  if (installmentCount <= 1 || isNaN(totalAmount) || totalAmount <= 0) {
    return null;
  }

  // Calculate integer cents
  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / installmentCount);
  const remainderCents = totalCents - baseCents * installmentCount;

  // Calculate starting invoice cycle
  const txDay = transactionDate.getUTCDate();
  const txMonth = transactionDate.getUTCMonth() + 1;
  const txYear = transactionDate.getUTCFullYear();

  let startYear = txYear;
  let startMonth = txMonth;
  if (txDay > closingDay) {
    startMonth = txMonth === 12 ? 1 : txMonth + 1;
    startYear = txMonth === 12 ? txYear + 1 : txYear;
  }

  const items: InstallmentPreviewItem[] = [];
  let curYear = startYear;
  let curMonth = startMonth;

  for (let i = 1; i <= installmentCount; i++) {
    const cents = i === 1 ? baseCents + remainderCents : baseCents;
    items.push({
      installmentNumber: i,
      amount: cents / 100,
      invoiceMonth: curMonth,
      invoiceYear: curYear,
    });

    curMonth++;
    if (curMonth > 12) {
      curMonth = 1;
      curYear++;
    }
  }

  return (
    <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span className="flex items-center space-x-1.5">
          <Receipt className="w-3.5 h-3.5 text-indigo-600" />
          <span>{t('expenses.form.installmentsSummary')}</span>
        </span>
        <span className="text-[11px] font-mono text-slate-500">
          {installmentCount}x
        </span>
      </div>

      <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 rounded-xl bg-white border border-slate-200/60">
        {items.map((item) => {
          const d = new Date(item.invoiceYear, item.invoiceMonth - 1, 1);
          const rawMonth = d.toLocaleDateString(locale, { month: 'short' }).replace('.', '');
          const monthStr = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);

          return (
            <div
              key={item.installmentNumber}
              className="px-3 py-2 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-700">
                  {t('expenses.installmentProgress', { current: item.installmentNumber, total: installmentCount })}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                  {monthStr}/{item.invoiceYear}
                </span>
              </div>
              <span className="font-bold text-slate-900 font-mono">
                {formatCurrency(item.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
