'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  CreditCard as CardIcon,
  Sparkles,
} from 'lucide-react';
import { CardData } from './CreditCardVisual';
import {
  AVAILABLE_BRANDS,
  BRAND_THEMES,
  CardBrandType,
} from './constants/brand-themes';
import { apiClient } from '@/lib/api-client';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cardToEdit?: CardData | null;
}

export function CardModal({
  isOpen,
  onClose,
  onSuccess,
  cardToEdit,
}: CardModalProps) {
  const isEditing = Boolean(cardToEdit);

  const [nickname, setNickname] = useState('');
  const [brand, setBrand] = useState<CardBrandType>('VISA');
  const [creditLimit, setCreditLimit] = useState('5000');
  const [closingDay, setClosingDay] = useState(5);
  const [dueDay, setDueDay] = useState(12);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cardToEdit) {
      setNickname(cardToEdit.nickname);
      setBrand(cardToEdit.brand);
      setCreditLimit(String(cardToEdit.creditLimit));
      setClosingDay(cardToEdit.closingDay);
      setDueDay(cardToEdit.dueDay);
    } else {
      setNickname('');
      setBrand('VISA');
      setCreditLimit('5000');
      setClosingDay(5);
      setDueDay(12);
    }
    setError(null);
  }, [cardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 30) {
      setError('Card nickname must be between 2 and 30 characters.');
      return;
    }

    const parsedLimit = parseFloat(creditLimit);
    if (isNaN(parsedLimit) || parsedLimit < 100 || parsedLimit > 1000000) {
      setError('Credit limit must be between R$ 100.00 and R$ 1,000,000.00.');
      return;
    }

    if (closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) {
      setError('Closing day and due day must be valid days between 1 and 31.');
      return;
    }

    if (closingDay === dueDay) {
      setError(
        'Closing day and due day cannot be the same day. Invoices require at least 1 day between statement close and payment due date.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && cardToEdit) {
        await apiClient(`/cards/${cardToEdit.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nickname: trimmedNickname,
            brand,
            creditLimit: parsedLimit,
            closingDay,
            dueDay,
          }),
        });
      } else {
        await apiClient('/cards', {
          method: 'POST',
          body: JSON.stringify({
            nickname: trimmedNickname,
            brand,
            creditLimit: parsedLimit,
            closingDay,
            dueDay,
          }),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save credit card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewTheme = BRAND_THEMES[brand] || BRAND_THEMES.VISA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CardIcon className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Credit Card' : 'New Credit Card'}
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

        {/* Live Visual Card Preview */}
        <div
          className={`relative rounded-2xl p-4 bg-linear-to-br ${previewTheme.gradient} ${previewTheme.textColor} shadow-md flex flex-col justify-between aspect-16/9 select-none overflow-hidden`}
        >
          <div className="flex items-center justify-between z-10">
            <div className="w-8 h-6 rounded-md bg-amber-300/90 border border-amber-400 shadow-inner" />
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${previewTheme.badgeBg} ${previewTheme.badgeText}`}
            >
              {previewTheme.displayName}
            </span>
          </div>

          <div className="z-10 mt-1">
            <p className="text-base font-bold tracking-tight truncate">
              {nickname.trim() || 'Card Nickname'}
            </p>
            <p className="text-xs font-mono text-white/70">•••• •••• •••• {brand.slice(0, 4)}</p>
          </div>

          <div className="flex items-center justify-between z-10 text-[11px] pt-1.5 border-t border-white/10">
            <span>Closes: Day {closingDay}</span>
            <span>Due: Day {dueDay}</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start space-x-2.5 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nickname input */}
          <div>
            <label
              htmlFor="card-nickname"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Card Nickname *
            </label>
            <input
              id="card-nickname"
              name="nickname"
              type="text"
              required
              minLength={2}
              maxLength={30}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Nubank Platinum, XP Infinite"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Network Brand selector */}
          <div>
            <label
              htmlFor="card-brand"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Network Brand *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {AVAILABLE_BRANDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBrand(b.id)}
                  className={`px-2 py-2 rounded-xl border text-center transition-all text-xs font-medium ${
                    brand === b.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Credit Limit input */}
          <div>
            <label
              htmlFor="card-credit-limit"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Credit Limit (BRL) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                R$
              </span>
              <input
                id="card-credit-limit"
                name="creditLimit"
                type="number"
                step="0.01"
                min="100"
                max="1000000"
                required
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="5000.00"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Closing Day & Due Day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="card-closing-day"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Closing Day (1–31) *
              </label>
              <input
                id="card-closing-day"
                name="closingDay"
                type="number"
                min="1"
                max="31"
                required
                value={closingDay}
                onChange={(e) => setClosingDay(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="card-due-day"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Due Day (1–31) *
              </label>
              <input
                id="card-due-day"
                name="dueDay"
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {closingDay === dueDay && (
            <p className="text-[11px] text-amber-600 font-medium">
              ⚠️ Closing day and due day cannot be identical.
            </p>
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
              disabled={isSubmitting || closingDay === dueDay}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Create Card'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
