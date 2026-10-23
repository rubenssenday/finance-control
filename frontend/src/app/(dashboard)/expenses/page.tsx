'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import {
  ExpenseModal,
  ExpenseData,
  PaymentMethodType,
  PaymentStatusType,
} from '@/components/expenses/ExpenseModal';
import { CsvImportModal } from '@/components/expenses/CsvImportModal';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { CashExpenseStatusToggle } from '@/components/settlement/CashExpenseStatusToggle';
import {
  Receipt,
  Plus,
  Upload,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  CreditCard,
  QrCode,
  FileText,
  Wallet,
  Repeat,
  Layers,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';

interface DeleteModalState {
  isOpen: boolean;
  expense: ExpenseData | null;
  scope: 'SINGLE' | 'FUTURE';
}

export default function ExpensesPage() {
  const { activeAccount } = useAuth();

  // Current Month/Year Navigation State
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12

  // Ledger Data State
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseData | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Delete Prompt Modal State
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    expense: null,
    scope: 'SINGLE',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Updating State
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Load Expenses from API
  const fetchExpenses = useCallback(async () => {
    if (!activeAccount) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });

      if (selectedMethod !== 'ALL') {
        params.append('method', selectedMethod);
      }
      if (selectedStatus !== 'ALL') {
        params.append('status', selectedStatus);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await apiClient<{
        status: string;
        data: ExpenseData[];
      }>(`/expenses?${params.toString()}`);

      setExpenses(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load expenses.');
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount, selectedYear, selectedMonth, selectedMethod, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

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
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [selectedYear, selectedMonth]);

  // Aggregate Metrics for Selected Month
  const metrics = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    let paidCount = 0;
    let pendingCount = 0;

    expenses.forEach((item) => {
      const val = Number(item.amount) || 0;
      total += val;
      if (item.paymentStatus === 'PAID') {
        paid += val;
        paidCount++;
      } else {
        pending += val;
        pendingCount++;
      }
    });

    return {
      total,
      paid,
      pending,
      paidCount,
      pendingCount,
      totalCount: expenses.length,
    };
  }, [expenses]);

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'number' ? val : Number(val) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // Status Change handler from CashExpenseStatusToggle
  const handleExpenseStatusChange = (updated: any) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)),
    );
  };

  // Open Delete Confirmation
  const promptDelete = (expense: ExpenseData) => {
    const isSeries = Boolean(
      (expense.installmentTotal && expense.installmentTotal > 1) ||
      expense.isRecurring,
    );

    setDeleteModal({
      isOpen: true,
      expense,
      scope: isSeries ? 'FUTURE' : 'SINGLE',
    });
  };

  // Execute Deletion
  const confirmDelete = async () => {
    if (!deleteModal.expense) return;

    try {
      setIsDeleting(true);
      const scopeParam = deleteModal.scope === 'FUTURE' ? '?scope=FUTURE' : '?scope=SINGLE';
      await apiClient(`/expenses/${deleteModal.expense.id}${scopeParam}`, {
        method: 'DELETE',
      });

      setSuccess('Despesa(s) excluída(s) com sucesso!');
      setTimeout(() => setSuccess(null), 4000);
      setDeleteModal({ isOpen: false, expense: null, scope: 'SINGLE' });
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir despesa.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderMethodBadge = (method: PaymentMethodType, card?: any) => {
    switch (method) {
      case 'CREDIT_CARD':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CreditCard className="w-3.5 h-3.5" />
            <span>{card?.nickname || 'Cartão de Crédito'}</span>
          </span>
        );
      case 'DEBIT_CARD':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Wallet className="w-3.5 h-3.5" />
            <span>Débito em Conta</span>
          </span>
        );
      case 'PIX':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <QrCode className="w-3.5 h-3.5" />
            <span>Pix Instantâneo</span>
          </span>
        );
      case 'BOLETO':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <FileText className="w-3.5 h-3.5" />
            <span>Boleto Bancário</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Month Navigator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide uppercase mb-2">
            <Receipt className="w-3.5 h-3.5" />
            <span>Controle Financeiro</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Despesas & Recorrências
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie pagamentos à vista, parcelamentos bancários e despesas fixas mensais.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* Month Navigation & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-lg">
        {/* Navigation Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white/10 rounded-2xl p-1 backdrop-blur-md">
            <button
              onClick={handlePrevMonth}
              title="Mês Anterior"
              className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-base sm:text-lg font-bold capitalize tracking-tight select-none">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              title="Próximo Mês"
              className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleCurrentMonth}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-md transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Quick totals in dark header */}
        <div className="flex items-center space-x-6 text-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 block font-medium">
              Total do Mês
            </span>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {formatCurrency(metrics.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Three Detailed KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Expense Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Faturado
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(metrics.total)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {metrics.totalCount} {metrics.totalCount === 1 ? 'registro' : 'registros'} neste mês
          </p>
        </div>

        {/* Paid Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Liquidado / Pago
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {formatCurrency(metrics.paid)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {metrics.paidCount} de {metrics.totalCount} contas liquidadas
          </p>
        </div>

        {/* Pending Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              A Pagar / Pendente
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {formatCurrency(metrics.pending)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {metrics.pendingCount} pendências em aberto
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
            placeholder="Buscar por descrição ou observações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Method & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="ALL">Todos os Meios</option>
            <option value="CREDIT_CARD">Cartão de Crédito</option>
            <option value="DEBIT_CARD">Débito</option>
            <option value="PIX">Pix</option>
            <option value="BOLETO">Boleto</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PAID">Liquidados / Pagos</option>
            <option value="PENDING">Pendentes</option>
          </select>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-500">
              Carregando lançamentos do mês...
            </span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Nenhuma despesa encontrada
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Não há lançamentos cadastrados para o período de {monthName} com os filtros selecionados.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsExpenseModalOpen(true);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Despesa</span>
              </button>
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Importar CSV</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-3">Vencimento / Data</th>
                  <th className="py-3.5 px-3">Descrição</th>
                  <th className="py-3.5 px-3">Categoria</th>
                  <th className="py-3.5 px-3">Pagamento</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3 text-right">Valor</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {expenses.map((expense) => {
                  const isUpdatingThis = updatingStatusId === expense.id;
                  const isInstallment = Boolean(
                    expense.installmentTotal && expense.installmentTotal > 1,
                  );

                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-xs">
                            {formatDate(expense.dueDate)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Compra: {formatDate(expense.transactionDate)}
                          </span>
                        </div>
                      </td>

                      {/* Description & Series Badges */}
                      <td className="py-4 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {expense.description}
                          </span>

                          {/* Installment Badge */}
                          {isInstallment && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800 border border-violet-200">
                              <Layers className="w-3 h-3" />
                              <span>
                                {expense.installmentNumber}/{expense.installmentTotal}
                              </span>
                            </span>
                          )}

                          {/* Recurring Badge */}
                          {expense.isRecurring && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Repeat className="w-3 h-3" />
                              <span>Fixa</span>
                            </span>
                          )}
                        </div>

                        {expense.notes && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {expense.notes}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        {expense.category ? (
                          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-semibold text-slate-700">
                            <span
                              className="w-5 h-5 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: expense.category.color }}
                            >
                              <CategoryIcon
                                name={expense.category.icon}
                                className="w-3 h-3"
                              />
                            </span>
                            <span>{expense.category.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Geral</span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        {renderMethodBadge(expense.paymentMethod, expense.card)}
                      </td>

                      {/* Status Toggle Badge */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <CashExpenseStatusToggle
                          expense={expense as any}
                          onStatusChange={handleExpenseStatusChange}
                          onError={(msg) => {
                            setError(msg);
                            setTimeout(() => setError(null), 5000);
                          }}
                        />
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-3 whitespace-nowrap text-right">
                        <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                          {formatCurrency(expense.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-3 pr-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setExpenseToEdit(expense);
                              setIsExpenseModalOpen(true);
                            }}
                            title="Editar lançamento"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => promptDelete(expense)}
                            title="Excluir lançamento"
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

      {/* Delete Confirmation Modal with Single vs Future Scope */}
      {deleteModal.isOpen && deleteModal.expense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Confirmar Exclusão
              </h3>
            </div>

            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir a despesa{' '}
              <strong className="text-slate-900">
                &ldquo;{deleteModal.expense.description}&rdquo;
              </strong>{' '}
              no valor de{' '}
              <strong className="text-slate-900">
                {formatCurrency(deleteModal.expense.amount)}
              </strong>
              ?
            </p>

            {/* Scope Selection for Installments / Recurring */}
            {((deleteModal.expense.installmentTotal &&
              deleteModal.expense.installmentTotal > 1) ||
              deleteModal.expense.isRecurring) && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Escopo da Exclusão
                </span>
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={deleteModal.scope === 'SINGLE'}
                    onChange={() =>
                      setDeleteModal((prev) => ({ ...prev, scope: 'SINGLE' }))
                    }
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Excluir apenas este lançamento específico</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={deleteModal.scope === 'FUTURE'}
                    onChange={() =>
                      setDeleteModal((prev) => ({ ...prev, scope: 'FUTURE' }))
                    }
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Excluir este e todos os lançamentos futuros da série</span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({ isOpen: false, expense: null, scope: 'SINGLE' })
                }
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal (Create & Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={() => {
          fetchExpenses();
          setSuccess('Despesa salva com sucesso!');
          setTimeout(() => setSuccess(null), 4000);
        }}
        expenseToEdit={expenseToEdit}
      />

      {/* CSV Batch Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={(count) => {
          fetchExpenses();
          setSuccess(`${count} despesas importadas com sucesso!`);
          setTimeout(() => setSuccess(null), 5000);
        }}
      />
    </div>
  );
}
