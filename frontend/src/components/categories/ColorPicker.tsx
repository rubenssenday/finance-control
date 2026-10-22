'use client';

import React from 'react';
import { Check } from 'lucide-react';

export const PRESET_COLORS = [
  '#FF6B6B', // Red / Coral
  '#4D96FF', // Blue
  '#FFD93D', // Yellow / Amber
  '#6BCB77', // Emerald / Green
  '#9D4EDD', // Purple / Violet
  '#FF9234', // Orange
  '#48CAE4', // Cyan / Sky
  '#2EC4B6', // Teal
  '#E63946', // Crimson
  '#F4A261', // Sand / Peach
  '#2A9D8F', // Forest / Jade
  '#E76F51', // Burnt Orange
  '#7209B7', // Deep Purple
  '#4361EE', // Indigo
  '#3A0CA3', // Navy
  '#F72585', // Magenta / Pink
];

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export function ColorPicker({
  selectedColor,
  onSelectColor,
}: ColorPickerProps) {
  const normalizedColor = selectedColor.toUpperCase();

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && val.length > 0) {
      val = `#${val}`;
    }
    onSelectColor(val);
  };

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(normalizedColor);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="colorHexInput"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          Theme Color
        </label>
        <span className="text-xs font-mono font-medium text-slate-500">
          {isValidHex ? normalizedColor : 'Invalid HEX'}
        </span>
      </div>

      {/* 16-Color Swatch Grid */}
      <div className="grid grid-cols-8 gap-2">
        {PRESET_COLORS.map((hex) => {
          const isSelected = normalizedColor === hex.toUpperCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => onSelectColor(hex)}
              title={hex}
              style={{ backgroundColor: hex }}
              className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-md'
                  : 'hover:scale-105 opacity-90 hover:opacity-100'
              }`}
            >
              {isSelected && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
            </button>
          );
        })}
      </div>

      {/* Custom Hex Input and Native Picker */}
      <div className="flex items-center space-x-2 pt-1">
        <div className="relative flex-1">
          <input
            id="colorHexInput"
            name="colorHexInput"
            type="text"
            maxLength={7}
            value={selectedColor}
            onChange={handleHexChange}
            placeholder="#4D96FF"
            className={`w-full px-3 py-2 text-xs font-mono rounded-xl border bg-slate-50/50 focus:bg-white text-slate-900 transition-all outline-hidden ${
              isValidHex
                ? 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                : 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            }`}
          />
        </div>

        {/* Native Color Input */}
        <div className="relative">
          <input
            id="nativeColorInput"
            name="nativeColorInput"
            type="color"
            value={isValidHex ? normalizedColor : '#4D96FF'}
            onChange={(e) => onSelectColor(e.target.value.toUpperCase())}
            className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
