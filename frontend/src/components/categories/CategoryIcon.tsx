'use client';

import React from 'react';
import {
  Utensils,
  Home,
  Zap,
  Car,
  HeartPulse,
  Film,
  GraduationCap,
  Wallet,
  ShoppingBag,
  ShoppingCart,
  Coffee,
  Plane,
  Fuel,
  Bus,
  Dumbbell,
  Tv,
  Smartphone,
  Wifi,
  PawPrint,
  Baby,
  Gift,
  Briefcase,
  Wrench,
  ShieldCheck,
  TrendingUp,
  PiggyBank,
  Landmark,
  BookOpen,
  Sparkles,
  CreditCard,
  Tag,
  LucideProps,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  utensils: Utensils,
  home: Home,
  zap: Zap,
  car: Car,
  'heart-pulse': HeartPulse,
  film: Film,
  'graduation-cap': GraduationCap,
  wallet: Wallet,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  coffee: Coffee,
  plane: Plane,
  fuel: Fuel,
  bus: Bus,
  dumbbell: Dumbbell,
  tv: Tv,
  smartphone: Smartphone,
  wifi: Wifi,
  'paw-print': PawPrint,
  baby: Baby,
  gift: Gift,
  briefcase: Briefcase,
  wrench: Wrench,
  'shield-check': ShieldCheck,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank,
  landmark: Landmark,
  'book-open': BookOpen,
  sparkles: Sparkles,
  'credit-card': CreditCard,
};

interface CategoryIconProps extends LucideProps {
  name: string;
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent {...props} />;
}
