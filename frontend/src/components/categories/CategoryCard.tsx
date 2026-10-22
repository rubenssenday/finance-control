'use client';

import React from 'react';
import { CategoryIcon } from './CategoryIcon';
import { Pencil, Trash2, Lock, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export interface CategoryData {
  id: string;
  accountId: string;
  name: string;
  type: 'EXPENSE' | 'INCOME';
  color: string;
  icon: string;
  isDefault: boolean;
  transactionCount: number;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryCardProps {
  category: CategoryData;
  onEdit: (category: CategoryData) => void;
  onDelete: (category: CategoryData) => void;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const isIncome = category.type === 'INCOME';

  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top Header: Icon & Badges */}
        <div className="flex items-start justify-between mb-4">
          <div
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
          >
            <CategoryIcon name={category.icon} className="w-6 h-6" />
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Type Badge */}
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isIncome
                  ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
              }`}
            >
              {isIncome ? (
                <ArrowUpCircle className="w-3 h-3 text-teal-600" />
              ) : (
                <ArrowDownCircle className="w-3 h-3 text-indigo-600" />
              )}
              <span>{isIncome ? 'Income' : 'Expense'}</span>
            </span>

            {/* Default System Badge */}
            {category.isDefault && (
              <span
                title="Pre-seeded system category (protected)"
                className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/70"
              >
                <Lock className="w-2.5 h-2.5 text-slate-400" />
                <span>System</span>
              </span>
            )}
          </div>
        </div>

        {/* Category Details */}
        <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
          {category.name}
        </h3>

        <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500">
          <span
            style={{ backgroundColor: category.color }}
            className="w-2.5 h-2.5 rounded-full shrink-0"
          />
          <span className="font-mono uppercase text-slate-400 text-xs">{category.color}</span>
          <span>•</span>
          <span>
            {category.transactionCount === 0
              ? 'No transactions'
              : `${category.transactionCount} transaction${category.transactionCount === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>

        {category.canDelete ? (
          <button
            type="button"
            onClick={() => onDelete(category)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        ) : (
          <span
            title={
              category.isDefault
                ? 'System default categories cannot be deleted'
                : `Cannot delete: category has ${category.transactionCount} associated transactions`
            }
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 rounded-xl cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-2xs uppercase">Protected</span>
          </span>
        )}
      </div>
    </div>
  );
}
