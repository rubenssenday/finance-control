import React from 'react';
import { InvoiceStatusBadge, DisplayInvoiceStatus } from './InvoiceStatusBadge';
import { Calendar, Receipt, ChevronRight } from 'lucide-react';

export interface InvoiceData {
  id: string;
  cardId: string;
  billingMonth: number;
  billingYear: number;
  closingDate: string;
  dueDate: string;
  totalAmount: number;
  status: DisplayInvoiceStatus;
  paidAt?: string | null;
}

interface InvoiceListProps {
  invoices: InvoiceData[];
  isLoading?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function InvoiceList({ invoices, isLoading }: InvoiceListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="h-10 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500">
        No statement cycles found for this card.
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'UTC',
    });
  };

  return (
    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
      {invoices.map((inv) => {
        const monthLabel = `${MONTH_NAMES[inv.billingMonth - 1]} ${inv.billingYear}`;
        return (
          <div
            key={inv.id}
            className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{monthLabel}</p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                  <span>Closes: {formatDate(inv.closingDate)}</span>
                  <span>•</span>
                  <span>Due: {formatDate(inv.dueDate)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-bold text-slate-900">
                  {formatCurrency(inv.totalAmount)}
                </p>
                <div className="mt-0.5">
                  <InvoiceStatusBadge status={inv.status} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
