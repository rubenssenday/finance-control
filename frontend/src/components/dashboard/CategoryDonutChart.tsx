'use client';

import React, { useState } from 'react';
import { CategoryBreakdownItem } from './dashboard-types';
import { formatCurrencyBRL } from '@/lib/export-utils';
import { CategoryIcon } from '../categories/CategoryIcon';
import { PieChart, Sparkles } from 'lucide-react';

interface CategoryDonutChartProps {
  categories: CategoryBreakdownItem[];
  totalExpenses: number;
  isLoading?: boolean;
}

export function CategoryDonutChart({
  categories,
  totalExpenses,
  isLoading,
}: CategoryDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs h-full min-h-[360px] animate-pulse">
        <div className="h-6 w-48 bg-slate-100 rounded-lg mb-6" />
        <div className="w-48 h-48 rounded-full bg-slate-50 mx-auto" />
      </div>
    );
  }

  const hasData = categories.length > 0 && totalExpenses > 0;

  // SVG Donut geometry
  const size = 220;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative offsets
  let accumulatedPercent = 0;
  const segments = categories.map((cat, idx) => {
    const percent = Math.min(100, Math.max(0, cat.percentage));
    const dashLength = (percent / 100) * circumference;
    const offset = (accumulatedPercent / 100) * circumference;
    accumulatedPercent += percent;

    return {
      ...cat,
      dashLength,
      dashOffset: -offset,
      index: idx,
    };
  });

  const activeCategory = hoveredIndex !== null ? categories[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Gastos por Categoria
            </h3>
            <p className="text-[11px] text-slate-400">
              Distribuição proporcional do mês
            </p>
          </div>
        </div>
      </div>

      {hasData ? (
        <div className="space-y-6">
          {/* SVG Donut Visual with Center Metric */}
          <div className="relative flex items-center justify-center py-2">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="rotate-[-90deg] transition-all transform origin-center"
            >
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
              />

              {/* Segments */}
              {segments.map((seg) => {
                const isHovered = hoveredIndex === seg.index;
                return (
                  <circle
                    key={seg.categoryId}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color || '#6366f1'}
                    strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                    strokeDasharray={`${seg.dashLength} ${circumference}`}
                    strokeDashoffset={seg.dashOffset}
                    strokeLinecap="butt"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredIndex(seg.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      filter: isHovered ? 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' : 'none',
                    }}
                  />
                );
              })}
            </svg>

            {/* Center Label in Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
              {activeCategory ? (
                <>
                  <span
                    className="text-[11px] font-bold truncate max-w-[120px] transition-all"
                    style={{ color: activeCategory.color }}
                  >
                    {activeCategory.name}
                  </span>
                  <span className="text-base font-black text-slate-900 mt-0.5 tracking-tight">
                    {formatCurrencyBRL(activeCategory.amount)}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 mt-1">
                    {activeCategory.percentage.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total do Mês
                  </span>
                  <span className="text-base font-black text-slate-900 mt-0.5 tracking-tight">
                    {formatCurrencyBRL(totalExpenses)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend Chips */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {categories.map((cat, idx) => {
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={cat.categoryId}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isHovered
                      ? 'bg-slate-100 scale-[1.02]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className="w-4 h-4 rounded-md flex items-center justify-center text-white shrink-0 text-[10px]"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-semibold text-slate-800 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="font-bold text-slate-900">
                      {formatCurrencyBRL(cat.amount)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 w-10 text-right">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <PieChart className="w-5 h-5" />
          </div>
          <p>Sem despesas registradas para categorização neste mês.</p>
        </div>
      )}
    </div>
  );
}
