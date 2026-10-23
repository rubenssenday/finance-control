'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  Receipt,
  CreditCard as CardIcon,
  QrCode,
  FileText,
  Wallet,
  Repeat,
  CheckCircle2,
} from 'lucide-react';
import { InstallmentPreviewTable } from './InstallmentPreviewTable';
import { CategoryIcon } from '../categories/CategoryIcon';
import { apiClient } from '@/lib/api-client';

export type PaymentMethodType = 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'PIX';
export type PaymentStatusType = 'PENDING' | 'PAID';

interface CategoryOption {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: string;
}

interface CardOption {
  id: string;
  nickname: string;
  brand: string;
  closingDay: number;
  dueDay: number;
}

export interface ExpenseData {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  transactionDate: string;
  dueDate: string;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  categoryId: string;
  cardId?: string | null;
  invoiceId?: string | null;
  installmentGroupId?: string | null;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  isRecurring: boolean;
  notes?: string | null;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  card?: {
    id: string;
    nickname: string;
    brand: string;
  };
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: ExpenseData | null;
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
}: ExpenseModalProps) {
  const isEditing = Boolean(expenseToEdit);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>('CREDIT_CARD');
  const [categoryId, setCategoryId] = useState('');
  const [cardId, setCardId] = useState('');
  const [installments, setInstallments] = useState(1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusType>('PENDING');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [cards, setCards] = useState<CardOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch categories and cards for account
    const loadResources = async () => {
      try {
        const [catRes, cardRes] = await Promise.all([
          apiClient<{ data: CategoryOption[] }>('/categories?type=EXPENSE'),
          apiClient<{ data: CardOption[] }>('/cards'),
        ]);

        const loadedCats = catRes.data || [];
        setCategories(loadedCats);
        if (!categoryId && loadedCats.length > 0) {
          setCategoryId(loadedCats[0].id);
        }

        const loadedCards = cardRes.data || [];
        setCards(loadedCards);
        if (!cardId && loadedCards.length > 0) {
          setCardId(loadedCards[0].id);
        }
      } catch (err) {
        console.error('Failed to load modal categories/cards:', err);
      }
    };

    loadResources();
  }, [isOpen]);

  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setAmount(String(expenseToEdit.amount));
      setTransactionDate(expenseToEdit.transactionDate.split('T')[0]);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setCategoryId(expenseToEdit.categoryId);
      setCardId(expenseToEdit.cardId || '');
      setInstallments(expenseToEdit.installmentTotal || 1);
      setIsRecurring(expenseToEdit.isRecurring);
      setPaymentStatus(expenseToEdit.paymentStatus);
      setDueDate(
        expenseToEdit.dueDate ? expenseToEdit.dueDate.split('T')[0] : '',
      );
      setNotes(expenseToEdit.notes || '');
    } else {
      setDescription('');
      setAmount('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('CREDIT_CARD');
      setInstallments(1);
      setIsRecurring(false);
      setPaymentStatus('PENDING');
      setDueDate('');
      setNotes('');
    }
    setError(null);
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const selectedCard = cards.find((c) => c.id === cardId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedDesc = description.trim();
    if (trimmedDesc.length < 3 || trimmedDesc.length > 100) {
      setError('Description must be between 3 and 100 characters.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0.01 || parsedAmount > 999999.99) {
      setError('Amount must be between R$ 0.01 and R$ 999,999.99.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    if (paymentMethod === 'CREDIT_CARD' && !cardId) {
      setError('Please select a credit card for this transaction.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && expenseToEdit) {
        await apiClient(`/expenses/${expenseToEdit.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            description: trimmedDesc,
            amount: parsedAmount,
            transactionDate: new Date(transactionDate).toISOString(),
            paymentMethod,
            paymentStatus,
            categoryId,
            cardId: paymentMethod === 'CREDIT_CARD' ? cardId : null,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            notes: notes ? notes.trim() : null,
          }),
        });
      } else {
        await apiClient('/expenses', {
          method: 'POST',
          body: JSON.stringify({
            description: trimmedDesc,
            amount: parsedAmount,
            transactionDate: new Date(transactionDate).toISOString(),
            paymentMethod,
            paymentStatus,
            categoryId,
            cardId: paymentMethod === 'CREDIT_CARD' ? cardId : undefined,
            installments:
              paymentMethod === 'CREDIT_CARD' ? installments : 1,
            isRecurring,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            notes: notes ? notes.trim() : null,
          }),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense. Please verify fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Expense' : 'New Expense'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Method Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Payment Method *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('CREDIT_CARD')}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                paymentMethod === 'CREDIT_CARD'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <CardIcon className="w-3.5 h-3.5" />
              <span>Credit Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('DEBIT_CARD')}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                paymentMethod === 'DEBIT_CARD'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Debit Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('PIX')}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                paymentMethod === 'PIX'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Pix</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('BOLETO')}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                paymentMethod === 'BOLETO'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Boleto</span>
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="expense-description"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Description *
              </label>
              <input
                id="expense-description"
                name="description"
                type="text"
                required
                minLength={3}
                maxLength={100}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Supermarket, Netflix, Electricity"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="expense-amount"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Amount (BRL) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                  R$
                </span>
                <input
                  id="expense-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="999999.99"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="150.00"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="expense-date"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Transaction Date *
              </label>
              <input
                id="expense-date"
                name="transactionDate"
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="expense-category"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Category *
              </label>
              <select
                id="expense-category"
                name="categoryId"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional: Credit Card Selector & Installments */}
          {paymentMethod === 'CREDIT_CARD' && (
            <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="expense-card"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Select Credit Card *
                  </label>
                  <select
                    id="expense-card"
                    name="cardId"
                    required
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nickname} ({c.brand})
                      </option>
                    ))}
                  </select>
                </div>

                {!isEditing && (
                  <div>
                    <label
                      htmlFor="expense-installments"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Installments (1x to 72x)
                    </label>
                    <select
                      id="expense-installments"
                      name="installments"
                      value={installments}
                      onChange={(e) =>
                        setInstallments(parseInt(e.target.value, 10))
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      {Array.from({ length: 72 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}x {n === 1 ? '(Single)' : 'installments'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Installments Simulation Schedule */}
              {installments > 1 && selectedCard && (
                <InstallmentPreviewTable
                  totalAmount={parseFloat(amount) || 0}
                  installmentCount={installments}
                  closingDay={selectedCard.closingDay}
                  transactionDate={new Date(transactionDate)}
                />
              )}
            </div>
          )}

          {/* Conditional: Boleto Custom Due Date */}
          {paymentMethod === 'BOLETO' && (
            <div>
              <label
                htmlFor="expense-due-date"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Boleto Due Date (defaults to +3 days)
              </label>
              <input
                id="expense-due-date"
                name="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          {/* Direct Cash Payment Status Toggle */}
          {paymentMethod !== 'CREDIT_CARD' && (
            <div className="flex items-center space-x-3 pt-1">
              <label className="text-xs font-semibold text-slate-700">
                Payment Status:
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAID')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Paid now
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PENDING')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    paymentStatus === 'PENDING'
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>
          )}

          {/* Recurring Monthly Toggle (Only on creation) */}
          {!isEditing && (
            <div className="flex items-center space-x-2.5 pt-1">
              <input
                id="expense-recurring"
                name="isRecurring"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
              />
              <label
                htmlFor="expense-recurring"
                className="text-xs font-medium text-slate-700 flex items-center space-x-1.5"
              >
                <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                <span>Repeat monthly (Materialize 12-month forward projection)</span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
