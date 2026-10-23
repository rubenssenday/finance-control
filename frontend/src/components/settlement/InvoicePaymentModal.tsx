'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

export interface InvoiceModalData {
  id: string;
  cardId: string;
  billingMonth: number;
  billingYear: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  updatedAt: string;
  card?: {
    nickname: string;
    brand: string;
  };
}

interface InvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceModalData | null;
  onSuccess: () => void;
}

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Default payment date to today in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      setPaymentDate(today);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDate = (isoStr: string) => {
    try {
      const parts = isoStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(isoStr).toLocaleDateString('pt-BR');
    } catch {
      return isoStr;
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const cycleTitle = `${monthNames[invoice.billingMonth - 1]} de ${invoice.billingYear}`;
  const cardName = invoice.card?.nickname || 'Cartão de Crédito';

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      await apiClient(`/cards/invoices/${invoice.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
          expectedUpdatedAt: invoice.updatedAt,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === 'CONCURRENT_STATUS_MUTATION') {
        setError('A fatura foi modificada em outra sessão. Recarregue a página.');
      } else {
        setError(err.message || 'Erro ao registrar pagamento da fatura.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <CreditCard className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Pagar Fatura do Cartão
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                {cardName} • {cycleTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmPayment} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Valor Total da Fatura</span>
              <span>Vencimento em {formatDate(invoice.dueDate)}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline space-x-1">
              <span className="text-emerald-600">
                {formatCurrency(invoice.totalAmount)}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Liquidação consolidada com baixa automática de todos os lançamentos
              </span>
            </div>
          </div>

          {/* Payment Date Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Data Efetiva do Pagamento
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Confirmation Prompt Box */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-medium">
            Confirmar o pagamento da fatura de <strong>{cardName}</strong> no valor de{' '}
            <strong className="text-emerald-700 font-bold">
              {formatCurrency(invoice.totalAmount)}
            </strong>{' '}
            com data de liquidação em{' '}
            <strong>{formatDate(paymentDate || invoice.dueDate)}</strong>?
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/25 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Pagamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
