'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { CategoryIcon, ICON_MAP } from './CategoryIcon';

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  accentColor?: string;
}

export function IconPicker({
  selectedIcon,
  onSelectIcon,
  accentColor = '#4F46E5',
}: IconPickerProps) {
  const [search, setSearch] = useState('');
  const allIcons = Object.keys(ICON_MAP);

  const filteredIcons = allIcons.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase().trim()),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="iconSearchInput"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          Select Icon ({allIcons.length} available)
        </label>
        <span className="text-xs text-slate-400 font-medium capitalize">
          Current: {selectedIcon}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          id="iconSearchInput"
          name="iconSearchInput"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter icons by name (e.g. food, car, home)..."
          className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-slate-900 transition-all outline-hidden"
        />
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/30">
        {filteredIcons.map((iconName) => {
          const isSelected = selectedIcon === iconName;
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onSelectIcon(iconName)}
              title={iconName}
              style={{
                backgroundColor: isSelected ? accentColor : undefined,
                color: isSelected ? '#ffffff' : undefined,
              }}
              className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${
                isSelected
                  ? 'shadow-md shadow-indigo-600/25 ring-2 ring-offset-2 ring-indigo-500 scale-105'
                  : 'hover:bg-slate-200/70 text-slate-600 hover:text-slate-900'
              }`}
            >
              <CategoryIcon name={iconName} className="w-5 h-5" />
            </button>
          );
        })}

        {filteredIcons.length === 0 && (
          <div className="col-span-full py-4 text-center text-xs text-slate-400">
            No icons matching &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
