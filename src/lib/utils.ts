import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GLASS_CARD = "bg-white border border-slate-200 shadow-sm rounded-2xl p-6";
export const GLASS_NAV = "bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50";
export const SIDEBAR_STYLE = "bg-white border-r border-slate-200 h-screen sticky top-0";
