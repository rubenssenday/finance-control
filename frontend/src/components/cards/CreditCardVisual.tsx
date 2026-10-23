'use client';

import React, { useState } from 'react';
import {
  BRAND_THEMES,
  CardBrandType,
} from './constants/brand-themes';
import { InvoiceList, InvoiceData } from './InvoiceList';
import {
  CreditCard as CardIcon,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Cpu,
  Wifi,
  Receipt,
  Calendar,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export interface CardData {
  id: string;
  accountId: string;
  nickname: string;
  brand: CardBrandType;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  isArchived: boolean;
  availableLimit: number;
  currentInvoice?: InvoiceData | null;
  createdAt: string;
  updatedAt: string;
}

interface CreditCardVisualProps {
  card: CardData;
  onEdit: (card: CardData) => void;
  onDelete: (card: CardData) => void;
  onToggleArchive: (card: CardData) => void;
  onInvoiceSettled?: () => void;
}

export function CreditCardVisual({
  card,
  onEdit,
  onDelete,
  onToggleArchive,
  onInvoiceSettled,
}: CreditCardVisualProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  const theme = BRAND_THEMES[card.brand] || BRAND_THEMES.VISA;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const limitUsed = Math.max(0, card.creditLimit - card.availableLimit);
  const usedPercentage = Math.min(
    100,
    Math.round((limitUsed / (card.creditLimit || 1)) * 100),
  );

  const fetchInvoices = async () => {
    try {
      setIsLoadingInvoices(true);
      const res = await apiClient<{
        status: string;
        data: InvoiceData[];
      }>(`/cards/${card.id}/invoices`);
      setInvoices(res.data || []);
      if (onInvoiceSettled) {
        onInvoiceSettled();
      }
    } catch (err) {
      console.error('Failed to load card invoices:', err);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleToggleExpand = async () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);

    if (nextState && invoices.length === 0) {
      await fetchInvoices();
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden">
      {/* Visual Credit Card Canvas */}
      <div className="p-4 sm:p-5">
        <div
          className={`relative rounded-2xl p-5 bg-linear-to-br ${theme.gradient} ${theme.textColor} shadow-lg ${theme.accentGlow} flex flex-col justify-between aspect-16/10 min-h-52 overflow-hidden select-none transition-transform hover:scale-[1.01]`}
        >
          {/* Subtle background circles for card texture */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-10 -bottom-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          {/* Top Bar: Chip + Contactless + Brand */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              {/* EMV Chip Simulation */}
              <div
                className={`w-10 h-7 rounded-md ${theme.chipColor} border flex items-center justify-center shadow-inner`}
              >
                <Cpu className="w-5 h-5 text-amber-900/60" />
              </div>
              <Wifi className="w-4 h-4 text-white/70 rotate-90" />
            </div>

            {/* Brand Logo Badge */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase backdrop-blur-xs border ${theme.badgeBg} ${theme.badgeText}`}
            >
              {theme.displayName}
            </div>
          </div>

          {/* Middle: Masked Number & Card Nickname */}
          <div className="z-10 mt-3">
            <p className="text-lg sm:text-xl font-bold tracking-tight line-clamp-1">
              {card.nickname}
            </p>
            <p className="text-xs tracking-widest font-mono text-white/70 mt-0.5">
              •••• •••• •••• {card.brand.slice(0, 4)}
            </p>
          </div>

          {/* Bottom Bar: Closing Day, Due Day & Current Invoice */}
          <div className="flex items-end justify-between z-10 text-xs pt-2 border-t border-white/10">
            <div>
              <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                Billing Cycle
              </p>
              <div className="flex items-center space-x-2 text-white font-medium mt-0.5 text-[11px]">
                <span>Closes: Day {card.closingDay}</span>
                <span>•</span>
                <span>Due: Day {card.dueDay}</span>
              </div>
            </div>

            {card.currentInvoice && (
              <div className="text-right">
                <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                  Open Invoice
                </p>
                <p className="text-xs font-bold text-white mt-0.5">
                  {formatCurrency(card.currentInvoice.totalAmount)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credit Limit & Progress Bar */}
      <div className="px-5 pb-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Available Limit</span>
          <span className="font-bold text-slate-900">
            {formatCurrency(card.availableLimit)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            style={{ width: `${usedPercentage}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              usedPercentage > 85
                ? 'bg-rose-500'
                : usedPercentage > 60
                ? 'bg-amber-500'
                : 'bg-indigo-600'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Used: {formatCurrency(limitUsed)}</span>
          <span>Limit: {formatCurrency(card.creditLimit)}</span>
        </div>
      </div>

      {/* Card Controls & Invoices Accordion Toggle */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <button
          type="button"
          onClick={handleToggleExpand}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{isExpanded ? 'Hide Invoices' : 'View Invoices'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onEdit(card)}
            title="Edit card"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleArchive(card)}
            title={card.isArchived ? 'Unarchive card' : 'Archive card'}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-colors"
          >
            {card.isArchived ? (
              <ArchiveRestore className="w-3.5 h-3.5" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onDelete(card)}
            title="Delete card"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Invoices Container */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/30 animate-fadeIn">
          <InvoiceList
            invoices={invoices}
            isLoading={isLoadingInvoices}
            cardNickname={card.nickname}
            cardBrand={card.brand}
            onInvoiceSettled={fetchInvoices}
          />
        </div>
      )}
    </div>
  );
}
