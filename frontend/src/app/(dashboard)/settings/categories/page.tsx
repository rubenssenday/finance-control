'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import {
  CategoryCard,
  CategoryData,
} from '@/components/categories/CategoryCard';
import { CategoryModal } from '@/components/categories/CategoryModal';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import {
  Tags,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Layers,
} from 'lucide-react';

const MAX_CUSTOM_CATEGORIES = 50;

type FilterType = 'ALL' | 'EXPENSE' | 'INCOME';

export default function CategoriesSettingsPage() {
  const { activeAccount } = useAuth();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryData | null>(null);

  // Delete confirmation state
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!activeAccount) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient<{
        status: string;
        data: CategoryData[];
      }>('/categories');

      setCategories(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Quota calculation (custom categories)
  const customCount = useMemo(
    () => categories.filter((c) => !c.isDefault).length,
    [categories],
  );
  const isQuotaReached = customCount >= MAX_CUSTOM_CATEGORIES;

  // Tab counts
  const expenseCount = useMemo(
    () => categories.filter((c) => c.type === 'EXPENSE').length,
    [categories],
  );
  const incomeCount = useMemo(
    () => categories.filter((c) => c.type === 'INCOME').length,
    [categories],
  );

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Type match
      if (activeTab === 'EXPENSE' && cat.type !== 'EXPENSE') return false;
      if (activeTab === 'INCOME' && cat.type !== 'INCOME') return false;

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        return cat.name.toLowerCase().includes(query);
      }

      return true;
    });
  }, [categories, activeTab, searchQuery]);

  const handleOpenCreateModal = () => {
    if (isQuotaReached) return;
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryData) => {
    setCategoryToEdit(cat);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (cat: CategoryData) => {
    setCategoryToDelete(cat);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient(`/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      setSuccess(`Category "${categoryToDelete.name}" successfully deleted.`);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Tags className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categories</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Organize expenses and incomes with customized names, icons, and colors.
          </p>
        </div>

        {/* Quota & Action Button */}
        <div className="flex items-center space-x-3">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 ${
              isQuotaReached
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : customCount > 40
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title="Max 50 custom categories allowed per account"
          >
            <span>Custom categories:</span>
            <span className="font-mono">
              {customCount} / {MAX_CUSTOM_CATEGORIES}
            </span>
          </div>

          <button
            id="create-category-button"
            name="createCategory"
            type="button"
            onClick={handleOpenCreateModal}
            disabled={isQuotaReached}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              isQuotaReached
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-600/20 active:scale-95'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 rounded-lg transition-colors text-rose-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls: Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Type Filter Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EXPENSE')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'EXPENSE'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-white/50'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Expenses</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-600">
              {expenseCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INCOME')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'INCOME'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-teal-600 hover:bg-white/50'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5 text-teal-500" />
            <span>Incomes</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-teal-50 text-teal-600">
              {incomeCount}
            </span>
          </button>
        </div>

        {/* Search input with accessible label */}
        <div className="relative w-full md:w-72">
          <label htmlFor="category-search" className="sr-only">
            Search categories
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="category-search"
            name="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs bg-white border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200/80 rounded-3xl">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-500">Loading categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-dashed border-slate-200 rounded-3xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Tags className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            {searchQuery
              ? `No categories match "${searchQuery}"`
              : 'No categories found'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mb-5">
            {searchQuery
              ? 'Try adjusting your search query or clear the filter to see all categories.'
              : 'Create custom categories to organize and group your income and expense records.'}
          </p>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              disabled={isQuotaReached}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              Add First Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleOpenEditModal}
              onDelete={handleDeletePrompt}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setSuccess(
            categoryToEdit
              ? `Category "${categoryToEdit.name}" updated successfully.`
              : 'New category created successfully.',
          );
          fetchCategories();
        }}
        categoryToEdit={categoryToEdit}
      />

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Category</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            {/* Preview of Category being deleted */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center space-x-3">
              <div
                style={{
                  backgroundColor: `${categoryToDelete.color}20`,
                  color: categoryToDelete.color,
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              >
                <CategoryIcon name={categoryToDelete.icon} className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {categoryToDelete.name}
                </p>
                <p className="text-xs text-slate-500">
                  {categoryToDelete.type === 'INCOME' ? 'Income' : 'Expense'} Category
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete this category? Only categories without
              associated transactions can be deleted.
            </p>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Category'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
