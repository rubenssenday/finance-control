'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface CsvValidationItem {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
  parsed: any;
}

interface CsvPreviewData {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  items: CsvValidationItem[];
}

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export function CsvImportModal({
  isOpen,
  onClose,
  onSuccess,
}: CsvImportModalProps) {
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState<CsvPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setPreviewData(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);

      // Trigger automatic preview
      try {
        setIsLoadingPreview(true);
        const res = await apiClient<{ data: CsvPreviewData }>(
          '/expenses/import/preview',
          {
            method: 'POST',
            body: JSON.stringify({ csvContent: text }),
          },
        );
        setPreviewData(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file.');
      } finally {
        setIsLoadingPreview(false);
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    const validRows = previewData.items
      .filter((i) => i.isValid && i.parsed)
      .map((i) => ({
        description: i.parsed.description,
        amount: i.parsed.amount,
        transactionDate: i.parsed.date,
        paymentMethod: i.parsed.method,
        categoryId: i.parsed.categoryId,
        cardId: i.parsed.cardId,
        installments: i.parsed.installments,
        notes: i.parsed.notes,
      }));

    if (validRows.length === 0) {
      setError('No valid rows available to import.');
      return;
    }

    try {
      setIsConfirming(true);
      setError(null);
      const res = await apiClient<{ data: { importedCount: number } }>(
        '/expenses/import/confirm',
        {
          method: 'POST',
          body: JSON.stringify({ rows: validRows }),
        },
      );

      onSuccess(res.data.importedCount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete batch import.');
    } finally {
      setIsConfirming(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Batch Import Expenses (CSV)
              </h2>
              <p className="text-xs text-slate-500">
                Upload a structured CSV to import multiple cash and card expenses.
              </p>
            </div>
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

        {/* Upload Dropzone */}
        {!previewData && !isLoadingPreview && (
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500/50 rounded-2xl p-8 text-center transition-all bg-slate-50/50">
            <input
              id="csv-file-input"
              name="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="csv-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Click to select or drag and drop your CSV file
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Expected columns: description, amount, date, method, category, card_nickname, installments
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Loading Preview */}
        {isLoadingPreview && (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">
              Analyzing CSV rows and validating categories...
            </p>
          </div>
        )}

        {/* Preview Results Table */}
        {previewData && (
          <div className="space-y-4">
            {/* Status counts banner */}
            <div className="flex items-center space-x-3 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 font-semibold text-slate-700">
                Total Rows: {previewData.totalRows}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                ✓ Valid: {previewData.validRows}
              </span>
              {previewData.invalidRows > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                  ✗ Errors: {previewData.invalidRows}
                </span>
              )}
            </div>

            {/* Rows list */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              {previewData.items.map((item) => (
                <div
                  key={item.rowNumber}
                  className={`p-3 text-xs flex items-start justify-between ${
                    item.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-400">
                        #{item.rowNumber}
                      </span>
                      {item.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="font-bold text-slate-900">
                        {item.parsed
                          ? item.parsed.description
                          : `Row #${item.rowNumber}`}
                      </span>
                    </div>

                    {item.isValid && item.parsed && (
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                        <span>{item.parsed.method}</span>
                        <span>•</span>
                        <span>{item.parsed.categoryName}</span>
                        {item.parsed.cardNickname && (
                          <>
                            <span>•</span>
                            <span>{item.parsed.cardNickname}</span>
                          </>
                        )}
                        {item.parsed.installments > 1 && (
                          <>
                            <span>•</span>
                            <span>{item.parsed.installments}x</span>
                          </>
                        )}
                      </div>
                    )}

                    {!item.isValid && (
                      <ul className="text-[11px] text-rose-600 list-disc list-inside">
                        {item.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {item.isValid && item.parsed && (
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(item.parsed.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {previewData ? (
            <button
              type="button"
              onClick={() => {
                setPreviewData(null);
                setFileName('');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Upload another file
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {previewData && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isConfirming || previewData.validRows === 0}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {isConfirming && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Import {previewData.validRows} Valid Expenses</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
