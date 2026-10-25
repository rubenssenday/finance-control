'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { useTranslation, useFormatters } from '@/lib/i18n/i18n-context';
import {
  IncomeModal,
  IncomeData,
  IncomeStatusType,
} from '@/components/incomes/IncomeModal';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import {
  TrendingUp,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Repeat,
  Calendar,
  X,
  Wallet,
} from 'lucide-react';

interface DeleteModalState {
  isOpen: boolean;
  income: IncomeData | null;
  scope: 'SINGLE' | 'FUTURE';
}

export default function IncomesPage() {
  const { activeAccount } = useAuth();
  const { t, locale } = useTranslation();
  const { formatCurrency, formatDate } = useFormatters();

  // Current Month/Year Navigation State
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12

  // Ledger Data State
  const [incomes, setIncomes] = useState<IncomeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal States
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState<IncomeData | null>(null);

  // Delete Prompt Modal State
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    income: null,
    scope: 'SINGLE',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Updating State
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Load Incomes from API
  const fetchIncomes = useCallback(async () => {
    if (!activeAccount) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });

      if (selectedStatus !== 'ALL') {
        params.append('status', selectedStatus);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await apiClient<{
        status: string;
        data: IncomeData[];
      }>(`/incomes?${params.toString()}`);

      setIncomes(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar receitas do mês.');
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount, selectedYear, selectedMonth, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  const monthName = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    return formatDate(date, { month: 'long', year: 'numeric' });
  }, [selectedYear, selectedMonth, formatDate]);

  // Aggregate Metrics for Selected Month
  const metrics = useMemo(() => {
    let total = 0;
    let received = 0;
    let pending = 0;
    let receivedCount = 0;
    let pendingCount = 0;

    incomes.forEach((item) => {
      const val = Number(item.amount) || 0;
      total += val;
      if (item.status === 'RECEIVED') {
        received += val;
        receivedCount++;
      } else {
        pending += val;
        pendingCount++;
      }
    });

    return {
      total,
      received,
      pending,
      receivedCount,
      pendingCount,
      totalCount: incomes.length,
    };
  }, [incomes]);

  // Quick Toggle Status handler
  const handleToggleStatus = async (income: IncomeData) => {
    const nextStatus: IncomeStatusType =
      income.status === 'RECEIVED' ? 'PENDING' : 'RECEIVED';

    try {
      setUpdatingStatusId(income.id);
      await apiClient(`/incomes/${income.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });

      // Update state locally
      setIncomes((prev) =>
        prev.map((i) => (i.id === income.id ? { ...i, status: nextStatus } : i)),
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar status da receita.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Open Delete Confirmation
  const promptDelete = (income: IncomeData) => {
    const isSeries = Boolean(income.isRecurring || income.incomeRecurrenceRuleId);

    setDeleteModal({
      isOpen: true,
      income,
      scope: isSeries ? 'FUTURE' : 'SINGLE',
    });
  };

  // Execute Deletion
  const confirmDelete = async () => {
    if (!deleteModal.income) return;

    try {
      setIsDeleting(true);
      const scopeParam =
        deleteModal.scope === 'FUTURE' ? '?scope=FUTURE' : '?scope=SINGLE';
      await apiClient(`/incomes/${deleteModal.income.id}${scopeParam}`, {
        method: 'DELETE',
      });

      setSuccess(t('incomes.deleteModal.success'));
      setTimeout(() => setSuccess(null), 4000);
      setDeleteModal({ isOpen: false, income: null, scope: 'SINGLE' });
      fetchIncomes();
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t('common.appName')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('incomes.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('incomes.subtitle')}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => {
              setIncomeToEdit(null);
              setIsIncomeModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('incomes.newIncome')}</span>
          </button>
        </div>
      </div>

      {/* Month Navigation & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-emerald-950 p-6 rounded-3xl text-white shadow-lg">
        {/* Navigation Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white/10 rounded-2xl p-1 backdrop-blur-md">
            <button
              onClick={handlePrevMonth}
              title={t('common.back')}
              className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-base sm:text-lg font-bold capitalize tracking-tight select-none">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              title={t('common.confirm')}
              className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleCurrentMonth}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-md transition-colors"
          >
            {t('common.today')}
          </button>
        </div>

        {/* Quick totals in dark header */}
        <div className="flex items-center space-x-6 text-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-300 block font-medium">
              {t('incomes.metrics.monthTotal')}
            </span>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {formatCurrency(metrics.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Three Detailed KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('incomes.metrics.totalExpected')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(metrics.total)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t('incomes.metrics.recordsCount', { count: metrics.totalCount })}
          </p>
        </div>

        {/* Received Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {t('incomes.metrics.liquidated')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {formatCurrency(metrics.received)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t('incomes.metrics.receivedCount', { received: metrics.receivedCount, total: metrics.totalCount })}
          </p>
        </div>

        {/* Pending Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {t('incomes.metrics.pendingToReceive')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {formatCurrency(metrics.pending)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t('incomes.metrics.pendingCount', { count: metrics.pendingCount })}
          </p>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-700 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{success}</div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t('incomes.filters.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          >
            <option value="ALL">{t('incomes.filters.allStatuses')}</option>
            <option value="RECEIVED">{t('incomes.status.RECEIVED')}</option>
            <option value="PENDING">{t('incomes.status.PENDING')}</option>
          </select>
        </div>
      </div>

      {/* Main Incomes Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-500">
              {t('common.loading')}
            </span>
          </div>
        ) : incomes.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('incomes.empty.title')}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {t('incomes.empty.subtitle', { period: monthName })}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setIncomeToEdit(null);
                  setIsIncomeModalOpen(true);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>{t('incomes.newIncome')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-3">{t('incomes.table.receiptDate')}</th>
                  <th className="py-3.5 px-3">{t('incomes.table.description')}</th>
                  <th className="py-3.5 px-3">{t('incomes.table.category')}</th>
                  <th className="py-3.5 px-3">{t('incomes.table.status')}</th>
                  <th className="py-3.5 px-3 text-right">{t('incomes.table.amount')}</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">{t('incomes.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {incomes.map((income) => {
                  const isUpdatingThis = updatingStatusId === income.id;

                  return (
                    <tr
                      key={income.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 text-xs">
                          {formatDate(income.receiptDate)}
                        </span>
                      </td>

                      {/* Description & Badges */}
                      <td className="py-4 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {income.description}
                          </span>

                          {/* Recurring Badge */}
                          {income.isRecurring && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Repeat className="w-3 h-3" />
                              <span>{t('incomes.table.fixed')}</span>
                            </span>
                          )}
                        </div>

                        {income.notes && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {income.notes}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        {income.category ? (
                          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-semibold text-slate-700">
                            <span
                              className="w-5 h-5 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: income.category.color }}
                            >
                              <CategoryIcon
                                name={income.category.icon}
                                className="w-3 h-3"
                              />
                            </span>
                            <span>{income.category.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">{t('incomes.table.generalCategory')}</span>
                        )}
                      </td>

                      {/* Status Toggle Badge */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(income)}
                          disabled={isUpdatingThis}
                          title={locale === 'pt-BR' ? 'Alternar status' : 'Toggle status'}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            income.status === 'RECEIVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {isUpdatingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : income.status === 'RECEIVED' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>
                            {income.status === 'RECEIVED' ? t('incomes.status.RECEIVED') : t('incomes.status.PENDING')}
                          </span>
                        </button>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-3 whitespace-nowrap text-right">
                        <span className="font-extrabold text-emerald-600 text-sm tracking-tight">
                          +{formatCurrency(income.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-3 pr-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setIncomeToEdit(income);
                              setIsIncomeModalOpen(true);
                            }}
                            title={t('incomes.table.editTooltip')}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => promptDelete(income)}
                            title={t('incomes.table.deleteTooltip')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.income && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {t('incomes.deleteModal.title')}
              </h3>
            </div>

            <p className="text-sm text-slate-600">
              {t('incomes.deleteModal.prompt', {
                description: deleteModal.income.description,
                amount: formatCurrency(deleteModal.income.amount),
              })}
            </p>

            {/* Scope Selection for Recurring Incomes */}
            {(deleteModal.income.isRecurring ||
              deleteModal.income.incomeRecurrenceRuleId) && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  {t('incomes.deleteModal.scopeTitle')}
                </span>
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={deleteModal.scope === 'SINGLE'}
                    onChange={() =>
                      setDeleteModal((prev) => ({ ...prev, scope: 'SINGLE' }))
                    }
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{t('incomes.deleteModal.scopeSingle')}</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={deleteModal.scope === 'FUTURE'}
                    onChange={() =>
                      setDeleteModal((prev) => ({ ...prev, scope: 'FUTURE' }))
                    }
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{t('incomes.deleteModal.scopeFuture')}</span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({ isOpen: false, income: null, scope: 'SINGLE' })
                }
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t('common.delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Income Modal (Create & Edit) */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={() => {
          fetchIncomes();
          setSuccess(t('incomes.deleteModal.savedSuccess'));
          setTimeout(() => setSuccess(null), 4000);
        }}
        incomeToEdit={incomeToEdit}
      />
    </div>
  );
}
