import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

export type DisplayInvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE';

interface InvoiceStatusBadgeProps {
  status: DisplayInvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({
  status,
  className = '',
}: InvoiceStatusBadgeProps) {
  switch (status) {
    case 'PAID':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Paid</span>
        </span>
      );
    case 'OVERDUE':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 animate-pulse ${className}`}
        >
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Overdue</span>
        </span>
      );
    case 'CLOSED':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 ${className}`}
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>Closed</span>
        </span>
      );
    case 'OPEN':
    default:
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 ${className}`}
        >
          <Clock className="w-3 h-3 text-indigo-600" />
          <span>Open</span>
        </span>
      );
  }
}
