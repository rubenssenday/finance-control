'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/i18n-context';

interface MonthSelectorProps {
  selectedYear: number;
  selectedMonth: number; // 1-12
  onChange: (year: number, month: number) => void;
}

export function MonthSelector({
  selectedYear,
  selectedMonth,
  onChange,
}: MonthSelectorProps) {
  const { locale, t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const currentRealYear = now.getFullYear();
  const currentRealMonth = now.getMonth() + 1;

  // Generate range: 2 months in past to 12 months in future (total ~15 months window)
  const timelineMonths = useMemo(() => {
    const list: { year: number; month: number; label: string; isCurrent: boolean }[] = [];
    const baseDate = new Date(currentRealYear, currentRealMonth - 1, 1);

    for (let offset = -2; offset <= 12; offset++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const isCurrent = y === currentRealYear && m === currentRealMonth;
      const shortYear = String(y).slice(-2);
      const rawMonth = d.toLocaleDateString(locale, { month: 'short' }).replace('.', '');
      const shortMonth = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
      const label = `${shortMonth}/${shortYear}`;

      list.push({
        year: y,
        month: m,
        label,
        isCurrent,
      });
    }

    return list;
  }, [currentRealYear, currentRealMonth, locale]);

  const handlePrev = () => {
    if (selectedMonth === 1) {
      onChange(selectedYear - 1, 12);
    } else {
      onChange(selectedYear, selectedMonth - 1);
    }
  };

  const handleNext = () => {
    if (selectedMonth === 12) {
      onChange(selectedYear + 1, 1);
    } else {
      onChange(selectedYear, selectedMonth + 1);
    }
  };

  const handleToday = () => {
    onChange(currentRealYear, currentRealMonth);
  };

  // Scroll active item into view smoothly
  useEffect(() => {
    if (scrollRef.current) {
      const activeBtn = scrollRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedYear, selectedMonth]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Navigation Controls: Arrows + Today button */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
          <button
            onClick={handlePrev}
            title={t('common.previousMonth')}
            className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-600 transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            title={t('common.nextMonth')}
            className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-indigo-600 transition-colors shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleToday}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{t('common.today')}</span>
        </button>
      </div>

      {/* Horizontal Timeline Carousel */}
      <div
        ref={scrollRef}
        className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1 px-1 -mx-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {timelineMonths.map((item) => {
          const isSelected = item.year === selectedYear && item.month === selectedMonth;

          return (
            <button
              key={`${item.year}-${item.month}`}
              data-active={isSelected}
              onClick={() => onChange(item.year, item.month)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-105'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{item.label}</span>
              {item.isCurrent && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
