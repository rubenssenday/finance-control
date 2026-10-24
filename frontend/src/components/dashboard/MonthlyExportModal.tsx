'use client';

import React from 'react';
import { MonthlyDashboardData } from './dashboard-types';
import { exportMonthlyStatementCsv, triggerPrintPdf, formatCurrencyBRL } from '@/lib/export-utils';
import {
  X,
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface MonthlyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthlyDashboardData;
}

export function MonthlyExportModal({
  isOpen,
  onClose,
  data,
}: MonthlyExportModalProps) {
  if (!isOpen) return null;

  const handleCsvExport = () => {
    exportMonthlyStatementCsv(data);
    onClose();
  };

  const handlePrintPdf = () => {
    onClose();
    setTimeout(() => {
      triggerPrintPdf();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Exportar Extrato Mensal
              </h3>
              <p className="text-xs text-slate-500">
                {data.period.monthName} de {data.period.year}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Statement Overview Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Período Selecionado</span>
            <span className="font-bold text-slate-900 capitalize">
              {data.period.monthName} / {data.period.year}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Receitas
              </span>
              <span className="font-bold text-emerald-600 text-sm">
                {formatCurrencyBRL(data.summary.totalIncome)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Despesas
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {formatCurrencyBRL(data.summary.totalExpenses)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Saldo Projetado
              </span>
              <span
                className={`font-bold text-sm ${
                  data.summary.netBalance >= 0
                    ? 'text-emerald-700'
                    : 'text-rose-600'
                }`}
              >
                {formatCurrencyBRL(data.summary.netBalance)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Lançamentos Totais
              </span>
              <span className="font-bold text-slate-700 text-sm">
                {data.summary.expenseCount + data.summary.incomeCount} itens
              </span>
            </div>
          </div>
        </div>

        {/* Export Formats Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Format 1: CSV */}
          <button
            onClick={handleCsvExport}
            className="flex flex-col items-start p-4 rounded-2xl border-2 border-slate-200/80 hover:border-indigo-600 hover:bg-indigo-50/20 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Planilha Excel (CSV)
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Arquivo formatado em UTF-8 com separador padrão para Excel e Google Sheets.
            </p>
          </button>

          {/* Format 2: PDF Print */}
          <button
            onClick={handlePrintPdf}
            className="flex flex-col items-start p-4 rounded-2xl border-2 border-slate-200/80 hover:border-indigo-600 hover:bg-indigo-50/20 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Imprimir / Salvar PDF
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Gera relatório executivo formatado em A4 com vetores nítidos via navegador.
            </p>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
