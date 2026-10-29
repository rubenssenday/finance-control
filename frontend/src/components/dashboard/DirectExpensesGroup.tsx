'use client';

import React from 'react';
import { DirectExpensesBlock, DirectExpenseItem } from './dashboard-types';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { CategoryIcon } from '../categories/CategoryIcon';
import { CashExpenseStatusToggle } from '../settlement/CashExpenseStatusToggle';
import {
  Wallet,
  FileText,
  QrCode,
  CheckCircle2,
  Clock,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface DirectExpensesGroupProps {
  directExpenses: DirectExpensesBlock;
  onStatusChange: (updatedExpense: any) => void;
  onError: (msg: string) => void;
  isLoading?: boolean;
}

export function DirectExpensesGroup({
  directExpenses,
  onStatusChange,
  onError,
  isLoading,
}: DirectExpensesGroupProps) {
  const { t, formatCurrency, formatDate } = useTranslation();
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-slate-50 rounded-2xl" />
          <div className="h-32 bg-slate-50 rounded-2xl" />
          <div className="h-32 bg-slate-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  const getMethodTitle = (key: 'BOLETO' | 'PIX' | 'DEBIT_CARD') => {
    switch (key) {
      case 'BOLETO':
        return t('dashboard.directExpensesBlock.boletos');
      case 'PIX':
        return t('dashboard.directExpensesBlock.pix');
      case 'DEBIT_CARD':
        return t('dashboard.directExpensesBlock.debit');
      default:
        return key;
    }
  };

  const methodSections = [
    {
      key: 'BOLETO' as const,
      data: directExpenses.methods.BOLETO,
      icon: FileText,
      themeColor: 'amber',
      headerBg: 'bg-amber-50',
      headerText: 'text-amber-800',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    {
      key: 'PIX' as const,
      data: directExpenses.methods.PIX,
      icon: QrCode,
      themeColor: 'teal',
      headerBg: 'bg-teal-50',
      headerText: 'text-teal-800',
      iconBg: 'bg-teal-100 text-teal-700',
    },
    {
      key: 'DEBIT_CARD' as const,
      data: directExpenses.methods.DEBIT_CARD,
      icon: Wallet,
      themeColor: 'emerald',
      headerBg: 'bg-emerald-50',
      headerText: 'text-emerald-800',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      {/* Block Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-1">
            <Wallet className="w-3.5 h-3.5" />
            <span>{t('dashboard.directExpensesBlock.badge')}</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('dashboard.directExpensesBlock.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('dashboard.directExpensesBlock.subtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-3 text-right">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              {t('common.subtotal')}
            </span>
            <span className="text-lg font-black text-slate-900">
              {formatCurrency(directExpenses.totalLiability)}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Columns / Cards for each Payment Method */}
      <div className="space-y-6">
        {methodSections.map((section) => {
          const { key, data, icon: Icon, headerBg, headerText, iconBg } = section;
          const hasItems = data.items.length > 0;
          const methodTitle = getMethodTitle(key);

          return (
            <div
              key={key}
              className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs"
            >
              {/* Method Panel Summary Header */}
              <div className={`p-4 ${headerBg} border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${headerText}`}>
                      {methodTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {data.itemCount === 1
                        ? t('dashboard.directExpensesBlock.recordCountOne', { count: data.itemCount })
                        : t('dashboard.directExpensesBlock.recordCountOther', { count: data.itemCount })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                      {t('expenses.status.PAID')}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(data.paidAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                      {t('expenses.status.PENDING')}
                    </span>
                    <span className="font-bold text-amber-600">
                      {formatCurrency(data.pendingAmount)}
                    </span>
                  </div>
                  <div className="pl-2 border-l border-slate-200 text-right">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                      {t('common.subtotal')}
                    </span>
                    <span className="font-black text-slate-900 text-sm">
                      {formatCurrency(data.subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List Table */}
              {hasItems ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-4">{t('dashboard.directExpensesBlock.dueDate')}</th>
                        <th className="py-2.5 px-3">{t('common.description')}</th>
                        <th className="py-2.5 px-3">{t('common.category')}</th>
                        <th className="py-2.5 px-3">{t('common.status')}</th>
                        <th className="py-2.5 px-4 text-right">{t('common.amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.items.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/75 transition-colors"
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 text-xs">
                              {formatDate(item.dueDate)}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            <div className="flex items-center space-x-1.5">
                              <span>{item.description}</span>
                              {item.installmentNumber && item.installmentTotal && (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200">
                                  <Layers className="w-2.5 h-2.5" />
                                  <span>
                                    {item.installmentNumber}/{item.installmentTotal}
                                  </span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {item.category ? (
                              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] font-semibold text-slate-700">
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
                              <span className="text-slate-400">{t('expenses.table.generalCategory')}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <CashExpenseStatusToggle
                              expense={item as any}
                              onStatusChange={onStatusChange}
                              onError={onError}
                            />
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-extrabold text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {t('dashboard.directExpensesBlock.emptyMethod', { method: methodTitle.toLowerCase() })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
