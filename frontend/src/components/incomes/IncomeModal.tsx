'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
  Wallet,
  Calendar,
  Repeat,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CategoryIcon } from '../categories/CategoryIcon';
import { apiClient } from '@/lib/api-client';

export type IncomeStatusType = 'RECEIVED' | 'PENDING';

interface CategoryOption {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: string;
}

export interface IncomeData {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  receiptDate: string;
  status: IncomeStatusType;
  categoryId: string;
  isRecurring: boolean;
  incomeRecurrenceRuleId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  incomeToEdit?: IncomeData | null;
}

export function IncomeModal({
  isOpen,
  onClose,
  onSuccess,
  incomeToEdit,
}: IncomeModalProps) {
  const isEditing = Boolean(incomeToEdit);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<IncomeStatusType>('RECEIVED');
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Income categories
  useEffect(() => {
    if (!isOpen) return;

    const loadCategories = async () => {
      try {
        const res = await apiClient<{ data: CategoryOption[] }>(
          '/categories?type=INCOME',
        );
        const loaded = res.data || [];
        setCategories(loaded);

        if (!categoryId && loaded.length > 0) {
          // Default pre-selected category: "Income/Salary" or first income category
          const defaultCat =
            loaded.find(
              (c) =>
                c.name.toLowerCase().includes('salary') ||
                c.name.toLowerCase().includes('salário') ||
                c.name.toLowerCase().includes('renda') ||
                c.name.toLowerCase().includes('receita'),
            ) || loaded[0];
          setCategoryId(defaultCat.id);
        }
      } catch (err) {
        console.error('Failed to load income categories:', err);
      }
    };

    loadCategories();
  }, [isOpen]);

  // Sync state when editing or resetting
  useEffect(() => {
    if (incomeToEdit) {
      setDescription(incomeToEdit.description);
      setAmount(String(incomeToEdit.amount));
      setReceiptDate(incomeToEdit.receiptDate.split('T')[0]);
      setCategoryId(incomeToEdit.categoryId);
      setStatus(incomeToEdit.status);
      setIsRecurring(incomeToEdit.isRecurring);
      setNotes(incomeToEdit.notes || '');
    } else {
      setDescription('');
      setAmount('');
      const todayStr = new Date().toISOString().split('T')[0];
      setReceiptDate(todayStr);
      setStatus('RECEIVED');
      setIsRecurring(false);
      setNotes('');
    }
    setError(null);
  }, [incomeToEdit, isOpen]);

  // Automatically update status based on date selection if user hasn't explicitly locked it
  const handleDateChange = (newDateStr: string) => {
    setReceiptDate(newDateStr);
    if (!isEditing) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (newDateStr > todayStr) {
        setStatus('PENDING');
      } else {
        setStatus('RECEIVED');
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('A descrição é obrigatória (3 a 100 caracteres).');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('O valor da receita deve ser maior que zero.');
      return;
    }

    if (!categoryId) {
      setError('Selecione uma categoria de receita.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: any = {
        description: description.trim(),
        amount: numericAmount,
        receiptDate: new Date(receiptDate).toISOString(),
        categoryId,
        status,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      if (!isEditing) {
        payload.isRecurring = isRecurring;
      }

      if (isEditing && incomeToEdit) {
        await apiClient(`/incomes/${incomeToEdit.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/incomes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar receita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Editar Receita' : 'Nova Receita'}
              </h2>
              <p className="text-xs text-slate-500">
                Registre entradas de caixa, salários e rendimentos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-700 text-xs font-semibold animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Description */}
          <div>
            <label
              htmlFor="income-description"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Descrição da Receita *
            </label>
            <input
              id="income-description"
              name="description"
              type="text"
              required
              minLength={3}
              maxLength={100}
              placeholder="Ex: Salário Mensal, Freelance, Dividendos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Amount & Receipt Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label
                htmlFor="income-amount"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  id="income-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="999999.99"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Receipt Date */}
            <div>
              <label
                htmlFor="income-receipt-date"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Data do Recebimento *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="income-receipt-date"
                  name="receiptDate"
                  type="date"
                  required
                  value={receiptDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label
              htmlFor="income-category"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Categoria de Receita *
            </label>
            <div className="relative">
              <select
                id="income-category"
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Settlement Status (Received vs Pending) */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Status do Pagamento
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('RECEIVED')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  status === 'RECEIVED'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recebido (Na Conta)</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('PENDING')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  status === 'PENDING'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Previsto (A Receber)</span>
              </button>
            </div>
          </div>

          {/* Monthly Recurrence Toggle (Only when creating) */}
          {!isEditing && (
            <div className="pt-2">
              <label className="flex items-start space-x-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 cursor-pointer hover:bg-emerald-50 transition-colors">
                <input
                  type="checkbox"
                  id="income-is-recurring"
                  name="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recorrência Mensal (Receita Fixa)</span>
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gera automaticamente projeções prospectivas de 12 meses no fluxo de caixa (ideal para salário ou aluguel).
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label
              htmlFor="income-notes"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Observações (Opcional)
            </label>
            <textarea
              id="income-notes"
              name="notes"
              rows={2}
              maxLength={500}
              placeholder="Informações adicionais sobre o pagamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Salvar Alterações' : 'Registrar Receita'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
