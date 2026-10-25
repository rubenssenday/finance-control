'use client';

import React, { useState } from 'react';
import { InvoiceStatusBadge, DisplayInvoiceStatus } from './InvoiceStatusBadge';
import {
  InvoicePaymentModal,
  InvoiceModalData,
} from '@/components/settlement/InvoicePaymentModal';
import { InvoiceReopenModal } from '@/components/settlement/InvoiceReopenModal';
import { Calendar, Receipt, CheckCircle2, RotateCcw } from 'lucide-react';
import { useTranslation, useFormatters } from '@/lib/i18n/i18n-context';

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
  updatedAt?: string;
  card?: {
    nickname: string;
    brand: string;
  };
}

interface InvoiceListProps {
  invoices: InvoiceData[];
  isLoading?: boolean;
  cardNickname?: string;
  cardBrand?: string;
  onInvoiceSettled?: () => void;
}

export function InvoiceList({
  invoices,
  isLoading,
  cardNickname,
  cardBrand,
  onInvoiceSettled,
}: InvoiceListProps) {
  const { t, locale } = useTranslation();
  const { formatCurrency, formatDate } = useFormatters();
  const [selectedPayInvoice, setSelectedPayInvoice] = useState<InvoiceModalData | null>(null);
  const [selectedReopenInvoice, setSelectedReopenInvoice] = useState<InvoiceModalData | null>(null);

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
      <div className="p-6 text-center text-xs text-slate-500 font-medium">
        {t('dashboard.creditCardsBlock.empty')}
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {invoices.map((inv) => {
          const monthLabel = formatDate(new Date(inv.billingYear, inv.billingMonth - 1, 1), {
            month: 'long',
            year: 'numeric',
          });
          const isPaid = inv.status === 'PAID';

          const modalData: InvoiceModalData = {
            id: inv.id,
            cardId: inv.cardId,
            billingMonth: inv.billingMonth,
            billingYear: inv.billingYear,
            totalAmount: inv.totalAmount,
            status: inv.status,
            dueDate: inv.dueDate,
            updatedAt: inv.updatedAt || new Date().toISOString(),
            card: {
              nickname: cardNickname || inv.card?.nickname || (locale === 'pt-BR' ? 'Cartão' : 'Card'),
              brand: cardBrand || inv.card?.brand || 'VISA',
            },
          };

          return (
            <div
              key={inv.id}
              className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs gap-3"
            >
              {/* Left Column: Icon & Cycle Dates */}
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isPaid
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {isPaid ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Receipt className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate capitalize">{monthLabel}</p>
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                    <span>{t('dashboard.creditCardsBlock.closingDate')}: {formatDate(inv.closingDate, { day: '2-digit', month: '2-digit' })}</span>
                    <span>•</span>
                    <span>{t('dashboard.creditCardsBlock.dueDate')}: {formatDate(inv.dueDate, { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Amount & Actions */}
              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right">
                  <p className="font-extrabold text-slate-900 text-xs">
                    {formatCurrency(inv.totalAmount)}
                  </p>
                  <div className="mt-0.5">
                    <InvoiceStatusBadge status={inv.status} />
                  </div>
                </div>

                {/* Settlement Actions */}
                <div className="flex items-center space-x-1">
                  {isPaid ? (
                    <button
                      type="button"
                      onClick={() => setSelectedReopenInvoice(modalData)}
                      title={t('settlement.reopenInvoiceTitle')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('dashboard.creditCardsBlock.reopenInvoice')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedPayInvoice(modalData)}
                      title={`${t('dashboard.creditCardsBlock.payInvoice')} (${formatCurrency(inv.totalAmount)})`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] uppercase tracking-wide shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('dashboard.creditCardsBlock.payInvoice')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      <InvoicePaymentModal
        isOpen={Boolean(selectedPayInvoice)}
        onClose={() => setSelectedPayInvoice(null)}
        invoice={selectedPayInvoice}
        onSuccess={() => {
          if (onInvoiceSettled) onInvoiceSettled();
        }}
      />

      {/* Reopen Warning Modal */}
      <InvoiceReopenModal
        isOpen={Boolean(selectedReopenInvoice)}
        onClose={() => setSelectedReopenInvoice(null)}
        invoice={selectedReopenInvoice}
        onSuccess={() => {
          if (onInvoiceSettled) onInvoiceSettled();
        }}
      />
    </>
  );
}
