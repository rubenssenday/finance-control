'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { MonthlyDashboardData } from '@/components/dashboard/dashboard-types';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { FinancialSummaryBar } from '@/components/dashboard/FinancialSummaryBar';
import { CreditCardBrandGroup } from '@/components/dashboard/CreditCardBrandGroup';
import { DirectExpensesGroup } from '@/components/dashboard/DirectExpensesGroup';
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart';
import { MonthlyExportModal } from '@/components/dashboard/MonthlyExportModal';
import {
  InvoicePaymentModal,
  InvoiceModalData,
} from '@/components/settlement/InvoicePaymentModal';
import { InvoiceReopenModal } from '@/components/settlement/InvoiceReopenModal';
import { formatCurrencyBRL, formatDateBRL } from '@/lib/export-utils';
import {
  LayoutDashboard,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  Wallet,
  TrendingUp,
  Receipt,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, activeAccount } = useAuth();

  // Current Month/Year Navigation State
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12

  // Analytics Data State
  const [dashboardData, setDashboardData] = useState<MonthlyDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [selectedPayInvoice, setSelectedPayInvoice] = useState<InvoiceModalData | null>(null);
  const [selectedReopenInvoice, setSelectedReopenInvoice] = useState<InvoiceModalData | null>(null);

  // Fetch Consolidated Monthly Analytics
  const fetchMonthlyDashboard = useCallback(async () => {
    if (!activeAccount) return;

    try {
      setIsLoading(true);
      setError(null);

      const res = await apiClient<{
        status: string;
        data: MonthlyDashboardData;
      }>(`/dashboard/monthly?year=${selectedYear}&month=${selectedMonth}`);

      setDashboardData(res.data);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar dados do painel financeiro.');
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchMonthlyDashboard();
  }, [fetchMonthlyDashboard]);

  // Handle Month Change from Timeline Selector
  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Direct Expense status change handler (from CashExpenseStatusToggle)
  const handleDirectExpenseStatusChange = () => {
    // Refresh analytics to update summary bar & direct block metrics
    fetchMonthlyDashboard();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner: Workspace Overview & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide uppercase mb-2">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Painel Financeiro Consolidado</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeAccount ? activeAccount.name : 'Painel Financeiro'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Visão consolidada de receitas, faturas de cartão de crédito e despesas à vista.
          </p>
        </div>

        {/* Action Buttons: Export Statement */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={!dashboardData}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar Extrato</span>
          </button>
        </div>
      </div>

      {/* Timeline Month Navigation Selector */}
      <div className="print:hidden">
        <MonthSelector
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onChange={handleMonthChange}
        />
      </div>

      {/* Alert Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 animate-fadeIn print:hidden">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-700 animate-fadeIn print:hidden">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{success}</div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top-Level Financial Summary Bar (5 Executive KPIs) */}
      {dashboardData ? (
        <FinancialSummaryBar summary={dashboardData.summary} isLoading={isLoading} />
      ) : (
        <FinancialSummaryBar
          summary={{
            totalIncome: 0,
            totalExpenses: 0,
            totalPaid: 0,
            totalPending: 0,
            netBalance: 0,
            incomeCount: 0,
            expenseCount: 0,
          }}
          isLoading={isLoading}
        />
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 col): Category Donut Chart & Cash Flow Health Card */}
        <div className="space-y-6">
          {/* Category Donut Chart */}
          <div className="min-h-[400px]">
            <CategoryDonutChart
              categories={dashboardData?.categoryBreakdown || []}
              totalExpenses={dashboardData?.summary.totalExpenses || 0}
              isLoading={isLoading}
            />
          </div>

          {/* Quick Financial Health Insight Card */}
          {dashboardData && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg space-y-4 print:hidden">
              <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Saúde Financeira do Mês</span>
              </div>

              <div>
                <p className="text-2xl font-black tracking-tight text-white">
                  {dashboardData.summary.netBalance >= 0 ? 'Superávit em Dia' : 'Atenção aos Gastos'}
                </p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {dashboardData.summary.netBalance >= 0
                    ? `Suas receitas superam as despesas em ${formatCurrencyBRL(
                        dashboardData.summary.netBalance,
                      )}. Você tem capacidade de poupança neste ciclo.`
                    : `Suas despesas projetadas superam suas receitas em ${formatCurrencyBRL(
                        Math.abs(dashboardData.summary.netBalance),
                      )}. Reavalie obrigações ou antecipe entradas.`}
                </p>
              </div>

              {/* Progress bar of Paid vs Total Expenses */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Progresso de Quitação</span>
                  <span className="text-emerald-400 font-bold">
                    {dashboardData.summary.totalExpenses > 0
                      ? `${Math.round(
                          (dashboardData.summary.totalPaid /
                            dashboardData.summary.totalExpenses) *
                            100,
                        )}% pago`
                      : '0% pago'}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${
                        dashboardData.summary.totalExpenses > 0
                          ? Math.min(
                              100,
                              (dashboardData.summary.totalPaid /
                                dashboardData.summary.totalExpenses) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Quick links to register */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <Link
                  href="/expenses"
                  className="inline-flex items-center space-x-1 text-indigo-300 hover:text-white transition-colors"
                >
                  <span>Ver todas despesas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/incomes"
                  className="inline-flex items-center space-x-1 text-emerald-300 hover:text-white transition-colors"
                >
                  <span>Ver receitas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (2 cols): Block 1 (Credit Cards by Brand) & Block 2 (Direct Expenses) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Block 1: Credit Cards Grouped by Brand */}
          {dashboardData && (
            <CreditCardBrandGroup
              creditCards={dashboardData.creditCards}
              onPayInvoice={(inv) => setSelectedPayInvoice(inv)}
              onReopenInvoice={(inv) => setSelectedReopenInvoice(inv)}
              isLoading={isLoading}
            />
          )}

          {/* Block 2: Other Expenses (Boleto, Pix, Débito) */}
          {dashboardData && (
            <DirectExpensesGroup
              directExpenses={dashboardData.directExpenses}
              onStatusChange={handleDirectExpenseStatusChange}
              onError={(msg) => {
                setError(msg);
                setTimeout(() => setError(null), 5000);
              }}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* --- Modals --- */}

      {/* Export Statement Modal */}
      {dashboardData && (
        <MonthlyExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          data={dashboardData}
        />
      )}

      {/* Invoice Payment Modal (F06) */}
      <InvoicePaymentModal
        isOpen={Boolean(selectedPayInvoice)}
        onClose={() => setSelectedPayInvoice(null)}
        invoice={selectedPayInvoice}
        onSuccess={() => {
          setSelectedPayInvoice(null);
          setSuccess('Fatura quitada com sucesso!');
          setTimeout(() => setSuccess(null), 4000);
          fetchMonthlyDashboard();
        }}
      />

      {/* Invoice Reopen Modal (F06) */}
      <InvoiceReopenModal
        isOpen={Boolean(selectedReopenInvoice)}
        onClose={() => setSelectedReopenInvoice(null)}
        invoice={selectedReopenInvoice}
        onSuccess={() => {
          setSelectedReopenInvoice(null);
          setSuccess('Fatura reaberta com sucesso.');
          setTimeout(() => setSuccess(null), 4000);
          fetchMonthlyDashboard();
        }}
      />

      {/* --- Dedicated Print Layout (shown only during window.print) --- */}
      <div className="hidden print:block font-sans text-black p-4 space-y-6">
        <div className="border-b-2 border-black pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black">EXTRATO FINANCEIRO MENSAL</h1>
            <p className="text-sm font-bold text-gray-700">
              Workspace: {activeAccount?.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold uppercase">
              {dashboardData?.period.monthName} / {dashboardData?.period.year}
            </p>
            <p className="text-xs text-gray-500">
              Impresso em: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Print Summary Table */}
        {dashboardData && (
          <div className="border border-gray-400 p-4 rounded-lg">
            <h2 className="text-base font-bold uppercase mb-2">Resumo Financeiro</h2>
            <div className="grid grid-cols-5 gap-2 text-xs">
              <div>
                <span className="block font-bold">Receita Total:</span>
                <span className="font-semibold">{formatCurrencyBRL(dashboardData.summary.totalIncome)}</span>
              </div>
              <div>
                <span className="block font-bold">Total Faturado:</span>
                <span className="font-semibold">{formatCurrencyBRL(dashboardData.summary.totalExpenses)}</span>
              </div>
              <div>
                <span className="block font-bold">Total Pago:</span>
                <span className="font-semibold">{formatCurrencyBRL(dashboardData.summary.totalPaid)}</span>
              </div>
              <div>
                <span className="block font-bold">Total Pendente:</span>
                <span className="font-semibold">{formatCurrencyBRL(dashboardData.summary.totalPending)}</span>
              </div>
              <div>
                <span className="block font-bold">Saldo Líquido:</span>
                <span className="font-black">{formatCurrencyBRL(dashboardData.summary.netBalance)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
