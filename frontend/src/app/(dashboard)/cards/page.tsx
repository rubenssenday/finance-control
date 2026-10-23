'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import {
  CreditCardVisual,
  CardData,
} from '@/components/cards/CreditCardVisual';
import { CardModal } from '@/components/cards/CardModal';
import {
  CreditCard as CardIcon,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Trash2,
  Archive,
  Wallet,
  Receipt,
  Sparkles,
} from 'lucide-react';

export default function CardsPage() {
  const { activeAccount } = useAuth();
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tab filter: Active vs Archived
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CardData | null>(null);

  // Delete prompt state
  const [cardToDelete, setCardToDelete] = useState<CardData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCards = useCallback(async () => {
    if (!activeAccount) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient<{
        status: string;
        data: CardData[];
      }>('/cards?includeArchived=true');

      setCards(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load credit cards.');
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Aggregate Metrics across active cards
  const activeCards = useMemo(
    () => cards.filter((c) => !c.isArchived),
    [cards],
  );
  const archivedCards = useMemo(
    () => cards.filter((c) => c.isArchived),
    [cards],
  );

  const totalLimit = useMemo(
    () => activeCards.reduce((acc, c) => acc + (Number(c.creditLimit) || 0), 0),
    [activeCards],
  );
  const totalAvailable = useMemo(
    () => activeCards.reduce((acc, c) => acc + (Number(c.availableLimit) || 0), 0),
    [activeCards],
  );
  const totalCommitted = Math.max(0, totalLimit - totalAvailable);

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'number' ? val : Number(val) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const displayedCards = activeTab === 'ACTIVE' ? activeCards : archivedCards;

  const handleOpenCreateModal = () => {
    setCardToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (card: CardData) => {
    setCardToEdit(card);
    setIsModalOpen(true);
  };

  const handleToggleArchive = async (card: CardData) => {
    try {
      setError(null);
      await apiClient(`/cards/${card.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isArchived: !card.isArchived }),
      });
      setSuccess(
        `Card "${card.nickname}" ${
          card.isArchived ? 'unarchived' : 'archived'
        } successfully.`,
      );
      fetchCards();
    } catch (err: any) {
      setError(err.message || 'Failed to update card status.');
    }
  };

  const handleDeletePrompt = (card: CardData) => {
    setCardToDelete(card);
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient(`/cards/${cardToDelete.id}`, {
        method: 'DELETE',
      });

      setSuccess(`Credit card "${cardToDelete.nickname}" successfully deleted.`);
      setCardToDelete(null);
      fetchCards();
    } catch (err: any) {
      setError(err.message || 'Failed to delete credit card.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CardIcon className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Credit Cards & Invoices
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage your card network limits, closing dates, and monthly statement invoices.
          </p>
        </div>

        <button
          id="create-card-button"
          name="createCard"
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-indigo-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Credit Card</span>
        </button>
      </div>

      {/* Financial Metrics Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Credit Limit */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Limit
            </p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">
              {formatCurrency(totalLimit)}
            </p>
          </div>
        </div>

        {/* Total Committed Balance */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Committed Invoices
            </p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">
              {formatCurrency(totalCommitted)}
            </p>
          </div>
        </div>

        {/* Available Limit */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Available
            </p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5 text-emerald-600">
              {formatCurrency(totalAvailable)}
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 rounded-lg transition-colors text-rose-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs: Active vs Archived */}
      <div className="flex items-center space-x-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <CardIcon className="w-3.5 h-3.5" />
          <span>Active Cards</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {activeCards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ARCHIVED')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ARCHIVED'
              ? 'bg-white text-amber-700 shadow-xs'
              : 'text-slate-600 hover:text-amber-600 hover:bg-white/50'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archived Cards</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700">
            {archivedCards.length}
          </span>
        </button>
      </div>

      {/* Main Cards Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200/80 rounded-3xl">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-500">Loading credit cards...</p>
        </div>
      ) : displayedCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-dashed border-slate-200 rounded-3xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <CardIcon className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            {activeTab === 'ACTIVE'
              ? 'No active credit cards registered'
              : 'No archived credit cards'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mb-5">
            {activeTab === 'ACTIVE'
              ? 'Add your credit cards to automatically calculate billing cycles, track limits, and schedule installments.'
              : 'Archived cards will appear here. They are preserved for historical invoices and reports.'}
          </p>
          {activeTab === 'ACTIVE' && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              Add First Credit Card
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayedCards.map((card) => (
            <CreditCardVisual
              key={card.id}
              card={card}
              onEdit={handleOpenEditModal}
              onDelete={handleDeletePrompt}
              onToggleArchive={handleToggleArchive}
              onInvoiceSettled={fetchCards}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <CardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setSuccess(
            cardToEdit
              ? `Credit card "${cardToEdit.nickname}" updated successfully.`
              : 'New credit card registered successfully.',
          );
          fetchCards();
        }}
        cardToEdit={cardToEdit}
      />

      {/* Delete Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Credit Card</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">{cardToDelete.nickname}</strong>?
              Cards with active statement transactions or unsettled balances cannot
              be deleted. Consider archiving the card instead.
            </p>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Card'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
