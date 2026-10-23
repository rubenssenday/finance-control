export type CardBrandType =
  | 'VISA'
  | 'MASTERCARD'
  | 'ELO'
  | 'AMEX'
  | 'HIPERCARD';

export interface BrandTheme {
  id: CardBrandType;
  displayName: string;
  gradient: string;
  textColor: string;
  chipColor: string;
  badgeBg: string;
  badgeText: string;
  accentGlow: string;
}

export const BRAND_THEMES: Record<CardBrandType, BrandTheme> = {
  VISA: {
    id: 'VISA',
    displayName: 'Visa',
    gradient: 'from-blue-600 via-indigo-700 to-slate-900',
    textColor: 'text-white',
    chipColor: 'bg-amber-300/90 border-amber-400',
    badgeBg: 'bg-blue-500/30 border-blue-400/40',
    badgeText: 'text-blue-100',
    accentGlow: 'shadow-blue-500/20',
  },
  MASTERCARD: {
    id: 'MASTERCARD',
    displayName: 'Mastercard',
    gradient: 'from-stone-900 via-zinc-800 to-amber-900',
    textColor: 'text-white',
    chipColor: 'bg-amber-300/90 border-amber-400',
    badgeBg: 'bg-amber-500/30 border-amber-400/40',
    badgeText: 'text-amber-100',
    accentGlow: 'shadow-amber-500/20',
  },
  ELO: {
    id: 'ELO',
    displayName: 'Elo',
    gradient: 'from-slate-900 via-sky-900 to-rose-950',
    textColor: 'text-white',
    chipColor: 'bg-yellow-300/90 border-yellow-400',
    badgeBg: 'bg-rose-500/30 border-rose-400/40',
    badgeText: 'text-rose-100',
    accentGlow: 'shadow-rose-500/20',
  },
  AMEX: {
    id: 'AMEX',
    displayName: 'American Express',
    gradient: 'from-emerald-900 via-teal-900 to-slate-950',
    textColor: 'text-white',
    chipColor: 'bg-slate-300/90 border-slate-400',
    badgeBg: 'bg-emerald-500/30 border-emerald-400/40',
    badgeText: 'text-emerald-100',
    accentGlow: 'shadow-emerald-500/20',
  },
  HIPERCARD: {
    id: 'HIPERCARD',
    displayName: 'Hipercard',
    gradient: 'from-red-800 via-rose-900 to-stone-950',
    textColor: 'text-white',
    chipColor: 'bg-amber-300/90 border-amber-400',
    badgeBg: 'bg-red-500/30 border-red-400/40',
    badgeText: 'text-red-100',
    accentGlow: 'shadow-red-500/20',
  },
};

export const AVAILABLE_BRANDS: Array<{ id: CardBrandType; label: string }> = [
  { id: 'VISA', label: 'Visa' },
  { id: 'MASTERCARD', label: 'Mastercard' },
  { id: 'ELO', label: 'Elo' },
  { id: 'AMEX', label: 'American Express' },
  { id: 'HIPERCARD', label: 'Hipercard' },
];
