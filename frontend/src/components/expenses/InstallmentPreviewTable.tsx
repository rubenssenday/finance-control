import React from 'react';
import { Receipt, CheckCircle2, Clock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/i18n-context';

export interface InstallmentPreviewItem {
  installmentNumber: number;
  amount: number;
  invoiceMonth?: number;
  invoiceYear?: number;
  dueDate?: Date;
  isPaid?: boolean;
}

interface InstallmentPreviewTableProps {
  totalAmount: number;
  installmentCount: number;
  closingDay?: number;
  transactionDate: Date | string;
  baseDueDate?: Date | string;
  firstInstallmentPaid?: boolean;
}

function extractDateParts(date: Date | string): { year: number; month: number; day: number } {
  if (typeof date === 'string') {
    const datePart = date.includes('T') ? date.split('T')[0] : date;
    const parts = datePart.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function parseDateSafely(dateInput?: Date | string): Date | undefined {
  if (!dateInput) return undefined;
  if (typeof dateInput === 'string') {
    const datePart = dateInput.includes('T') ? dateInput.split('T')[0] : dateInput;
    const parts = datePart.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
  }
  return new Date(dateInput);
}

function addMonthsSafely(baseDate: Date, monthsToAdd: number): Date {
  if (monthsToAdd === 0) {
    return new Date(baseDate.getTime());
  }

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();

  const totalMonths = month + monthsToAdd;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(day, maxDays);

  return new Date(targetYear, targetMonth, targetDay, 12, 0, 0);
}

export function InstallmentPreviewTable({
  totalAmount,
  installmentCount,
  closingDay,
  transactionDate,
  baseDueDate,
  firstInstallmentPaid = false,
}: InstallmentPreviewTableProps) {
  const { t, formatCurrency, formatDate, locale } = useTranslation();

  if (installmentCount <= 1 || isNaN(totalAmount) || totalAmount <= 0) {
    return null;
  }

  // Calculate integer cents for 100% precision
  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / installmentCount);
  const remainderCents = totalCents - baseCents * installmentCount;

  const isCreditCard = closingDay !== undefined && closingDay !== null;
  const items: InstallmentPreviewItem[] = [];

  if (isCreditCard) {
    // Credit card invoice cycle calculation
    const { year: txYear, month: txMonth, day: txDay } = extractDateParts(transactionDate);

    let startYear = txYear;
    let startMonth = txMonth;
    // Purchases on or after closing day belong to the next billing cycle
    if (txDay >= (closingDay as number)) {
      startMonth = txMonth === 12 ? 1 : txMonth + 1;
      startYear = txMonth === 12 ? txYear + 1 : txYear;
    }

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
  } else {
    // Non-credit card (Boleto, Pix, Debit) monthly due dates
    const effectiveBaseDate =
      parseDateSafely(baseDueDate) ||
      parseDateSafely(transactionDate) ||
      new Date();

    for (let i = 1; i <= installmentCount; i++) {
      const cents = i === 1 ? baseCents + remainderCents : baseCents;
      const dueDate = addMonthsSafely(effectiveBaseDate, i - 1);
      const isPaid = i === 1 && firstInstallmentPaid;

      items.push({
        installmentNumber: i,
        amount: cents / 100,
        dueDate,
        isPaid,
      });
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
          let dateLabel = '';
          if (isCreditCard && item.invoiceYear && item.invoiceMonth) {
            const d = new Date(item.invoiceYear, item.invoiceMonth - 1, 1);
            const rawMonth = d
              .toLocaleDateString(locale, { month: 'short' })
              .replace('.', '');
            const monthStr =
              rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
            dateLabel = `${monthStr}/${item.invoiceYear}`;
          } else if (item.dueDate) {
            dateLabel = formatDate(item.dueDate);
          }

          return (
            <div
              key={item.installmentNumber}
              className="px-3 py-2 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-700">
                  {t('expenses.installmentProgress', {
                    current: item.installmentNumber,
                    total: installmentCount,
                  })}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                  {dateLabel}
                </span>
                {!isCreditCard && item.isPaid && (
                  <span className="inline-flex items-center space-x-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    <span>{t('expenses.form.paidNow')}</span>
                  </span>
                )}
                {!isCreditCard && !item.isPaid && firstInstallmentPaid && (
                  <span className="inline-flex items-center space-x-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                    <span>{t('expenses.form.pendingStatus')}</span>
                  </span>
                )}
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
