'use client';

import React, { useState } from 'react';
import { CreditCardsBlock, BrandGroupCard } from './dashboard-types';
import { formatCurrencyBRL, formatDateBRL } from '@/lib/export-utils';
import { CategoryIcon } from '../categories/CategoryIcon';
import {
  CreditCard,
  ChevronDown,
  ChevronRight,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface CreditCardBrandGroupProps {
  creditCards: CreditCardsBlock;
  onPayInvoice: (invoiceData: any) => void;
  onReopenInvoice: (invoiceData: any) => void;
  isLoading?: boolean;
}

export function CreditCardBrandGroup({
  creditCards,
  onPayInvoice,
  onReopenInvoice,
  isLoading,
}: CreditCardBrandGroupProps) {
  // Track open cards by ID: by default open the first card
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-100 rounded-lg" />
        <div className="h-24 bg-slate-50 rounded-2xl" />
        <div className="h-24 bg-slate-50 rounded-2xl" />
      </div>
    );
  }

  if (creditCards.brandGroups.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <CreditCard className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Nenhum Cartão de Crédito Ativo</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Cadastre seus cartões de crédito na aba Cartões para visualizar faturas consolidadas por bandeira aqui.
        </p>
      </div>
    );
  }

  const getBrandBadge = (brand: string, brandName: string) => {
    switch (brand) {
      case 'VISA':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-700 border border-blue-200/80 tracking-wide uppercase">
            {brandName}
          </span>
        );
      case 'MASTERCARD':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-orange-50 text-orange-700 border border-orange-200/80 tracking-wide uppercase">
            {brandName}
          </span>
        );
      case 'ELO':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-200/80 tracking-wide uppercase">
            {brandName}
          </span>
        );
      case 'AMEX':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-cyan-50 text-cyan-700 border border-cyan-200/80 tracking-wide uppercase">
            {brandName}
          </span>
        );
      case 'HIPERCARD':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200/80 tracking-wide uppercase">
            {brandName}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700 border border-slate-200 tracking-wide uppercase">
            {brandName}
          </span>
        );
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fatura Paga</span>
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Fechada (A Pagar)</span>
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Fatura Vencida</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Fatura em Aberto</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide uppercase mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Bloco 1: Cartões de Crédito</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Faturas por Bandeira
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidação por rede e detalhamento de compras incluídas no ciclo mensal.
          </p>
        </div>

        {/* Total liability badge */}
        <div className="flex items-center space-x-3 text-right">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total em Faturas
            </span>
            <span className="text-lg font-black text-slate-900">
              {formatCurrencyBRL(creditCards.totalLiability)}
            </span>
          </div>
        </div>
      </div>

      {/* Brand Groups */}
      <div className="space-y-6">
        {creditCards.brandGroups.map((group) => (
          <div
            key={group.brand}
            className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4 space-y-3"
          >
            {/* Brand Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getBrandBadge(group.brand, group.brandName)}
                <span className="text-xs font-semibold text-slate-500">
                  {group.cardCount} {group.cardCount === 1 ? 'cartão' : 'cartões'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-slate-900">
                  {formatCurrencyBRL(group.totalAmount)}
                </span>
              </div>
            </div>

            {/* Individual Cards under this Brand */}
            <div className="space-y-3 pt-1">
              {group.cards.map((card) => {
                const isExpanded = expandedCards[card.cardId] ?? false;
                const invoice = card.invoice;
                const hasPurchases = Boolean(invoice && invoice.items && invoice.items.length > 0);

                return (
                  <div
                    key={card.cardId}
                    className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all"
                  >
                    {/* Card Summary Header */}
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleCard(card.cardId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title={isExpanded ? 'Recolher compras' : 'Ver compras detalhadas'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {card.nickname}
                          </h4>
                          <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-0.5">
                            <span>Fecha dia {card.closingDay}</span>
                            <span>•</span>
                            <span>Vence dia {card.dueDay}</span>
                            {invoice && (
                              <>
                                <span>•</span>
                                <span>Vencimento: {formatDateBRL(invoice.dueDate)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Invoice status, total, and Actions */}
                      <div className="flex items-center space-x-3 ml-8 md:ml-0">
                        {invoice ? (
                          <>
                            {getInvoiceStatusBadge(invoice.status)}

                            <span className="text-base font-extrabold text-slate-900">
                              {formatCurrencyBRL(invoice.totalAmount)}
                            </span>

                            {invoice.status === 'PAID' ? (
                              <button
                                onClick={() =>
                                  onReopenInvoice({
                                    id: invoice.id,
                                    cardNickname: card.nickname,
                                    billingMonth: invoice.billingMonth,
                                    billingYear: invoice.billingYear,
                                    totalAmount: invoice.totalAmount,
                                    expensesCount: invoice.items?.length || 0,
                                  })
                                }
                                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reabrir</span>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  onPayInvoice({
                                    id: invoice.id,
                                    cardNickname: card.nickname,
                                    billingMonth: invoice.billingMonth,
                                    billingYear: invoice.billingYear,
                                    totalAmount: invoice.totalAmount,
                                    dueDate: invoice.dueDate,
                                  })
                                }
                                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shadow-indigo-600/20 transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Pagar</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">Sem fatura ativa</span>
                        )}
                      </div>
                    </div>

                    {/* Expandable Purchases Table */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/40 p-4 animate-fadeIn">
                        {hasPurchases && invoice ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  <th className="py-2 px-3">Data Compra</th>
                                  <th className="py-2 px-3">Descrição</th>
                                  <th className="py-2 px-3">Categoria</th>
                                  <th className="py-2 px-3">Parcela</th>
                                  <th className="py-2 px-3 text-right">Valor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {invoice.items.map((item) => (
                                  <tr
                                    key={item.id}
                                    className="hover:bg-slate-100/50 transition-colors"
                                  >
                                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-medium">
                                      {formatDateBRL(item.transactionDate)}
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                                      {item.description}
                                    </td>
                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                      {item.category ? (
                                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-white border border-slate-200/60 text-[11px] font-semibold text-slate-700">
                                          <span
                                            className="w-3.5 h-3.5 rounded-md flex items-center justify-center text-white text-[9px]"
                                            style={{ backgroundColor: item.category.color }}
                                          >
                                            <CategoryIcon
                                              name={item.category.icon}
                                              className="w-2.5 h-2.5"
                                            />
                                          </span>
                                          <span>{item.category.name}</span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400">Geral</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                      {item.installmentTotal && item.installmentTotal > 1 ? (
                                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-violet-100 text-violet-800 border border-violet-200">
                                          <Layers className="w-3 h-3" />
                                          <span>
                                            {item.installmentNumber}/{item.installmentTotal}
                                          </span>
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-[11px]">À vista</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-900">
                                      {formatCurrencyBRL(item.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 text-center py-2">
                            Nenhum lançamento registrado nesta fatura para o mês selecionado.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
