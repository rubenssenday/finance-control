'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { CategoryData } from './CategoryCard';
import { CategoryIcon } from './CategoryIcon';
import { IconPicker } from './IconPicker';
import { ColorPicker, PRESET_COLORS } from './ColorPicker';
import { apiClient } from '@/lib/api-client';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: CategoryData | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
}: CategoryModalProps) {
  const { t } = useTranslation();
  const isEditing = Boolean(categoryToEdit);

  const [name, setName] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState('utensils');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setColor(categoryToEdit.color);
      setIcon(categoryToEdit.icon);
    } else {
      setName('');
      setType('EXPENSE');
      setColor(PRESET_COLORS[0]);
      setIcon('utensils');
    }
    setError(null);
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 40) {
      setError('Category name must be between 2 and 40 characters.');
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setError('Please provide a valid 6-character hex color code (e.g. #FF6B6B).');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && categoryToEdit) {
        await apiClient(`/categories/${categoryToEdit.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: trimmedName,
            color: color.toUpperCase(),
            icon,
          }),
        });
      } else {
        await apiClient('/categories', {
          method: 'POST',
          body: JSON.stringify({
            name: trimmedName,
            type,
            color: color.toUpperCase(),
            icon,
          }),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div
              style={{ backgroundColor: `${color}20`, color }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs transition-colors"
            >
              <CategoryIcon name={icon} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? t('categories.form.editTitle') : t('categories.form.createTitle')}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? t('categories.form.editSubtitle')
                  : t('categories.form.createSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-200/80 flex items-center space-x-3.5">
          <div
            style={{ backgroundColor: `${color}25`, color }}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
          >
            <CategoryIcon name={icon} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('categories.form.livePreview')}
              </span>
              <span className="text-2xs px-2 py-0.5 rounded-full font-semibold bg-white border border-slate-200 text-slate-600">
                {type === 'INCOME' ? t('categories.card.income') : t('categories.card.expense')}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {name.trim() || t('categories.form.name')}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="categoryName"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              {t('categories.form.name')}
            </label>
            <input
              id="categoryName"
              name="categoryName"
              type="text"
              required
              minLength={2}
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('categories.form.namePlaceholder')}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-slate-900 transition-all outline-hidden"
            />
            <div className="flex justify-between mt-1 text-2xs text-slate-400">
              <span>{t('categories.form.lengthRule')}</span>
              <span>{t('categories.form.charCount', { current: name.length })}</span>
            </div>
          </div>

          {/* Type Selector (only on create) */}
          {!isEditing && (
            <div>
              <label
                htmlFor="categoryType"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                {t('categories.form.classificationType')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('EXPENSE')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    type === 'EXPENSE'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('categories.form.expenseType')}
                </button>
                <button
                  type="button"
                  onClick={() => setType('INCOME')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    type === 'INCOME'
                      ? 'border-teal-600 bg-teal-50/80 text-teal-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('categories.form.incomeType')}
                </button>
              </div>
            </div>
          )}

          {/* Color Picker Component */}
          <ColorPicker selectedColor={color} onSelectColor={setColor} />

          {/* Icon Picker Component */}
          <IconPicker
            selectedIcon={icon}
            onSelectIcon={setIcon}
            accentColor={color}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('common.saving')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isEditing ? t('categories.form.saveButton') : t('categories.form.createButton')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
