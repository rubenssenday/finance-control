'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { AlertTriangle, AlertCircle, Loader2, X, RotateCcw } from 'lucide-react';
import { InvoiceModalData } from './InvoicePaymentModal';

interface InvoiceReopenModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceModalData | null;
  onSuccess: () => void;
}

export const InvoiceReopenModal: React.FC<InvoiceReopenModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const cycleTitle = `${monthNames[invoice.billingMonth - 1]} de ${invoice.billingYear}`;
  const cardName = invoice.card?.nickname || 'Cartão de Crédito';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const handleConfirmReopen = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      await apiClient(`/cards/invoices/${invoice.id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({
          confirmReopen: true,
          expectedUpdatedAt: invoice.updatedAt,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === 'CONCURRENT_STATUS_MUTATION') {
        setError('A fatura foi modificada em outra sessão. Recarregue a página.');
      } else {
        setError(err.message || 'Erro ao reabrir fatura.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <AlertTriangle className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Reabrir Fatura Paga
              </h2>
              <p className="text-xs text-amber-100/90 font-medium">
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Warning Message Box */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-2">
            <p className="text-sm font-bold text-amber-950">
              Deseja realmente reabrir esta fatura?
            </p>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Ao reabrir a fatura de <strong>{cardName}</strong> ({formatCurrency(invoice.totalAmount)}), 
              o status da fatura será revertido e <strong>todas as compras e parcelas incluídas voltarão ao status Pendente</strong>.
            </p>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Esta ação permite corrigir pagamentos acidentais ou ajustar compras lançadas nesta fatura antes de liquidá-la novamente.
          </p>

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
              type="button"
              onClick={handleConfirmReopen}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-600/25 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reabrindo...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Sim, Reabrir Fatura</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
