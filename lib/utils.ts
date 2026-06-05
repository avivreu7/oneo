import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeLeft(deadline: string | null): number {
  if (!deadline) return 0;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}

export function getDifficultyColor(percent: number): string {
  if (percent >= 70) return 'text-green-400';
  if (percent >= 35) return 'text-yellow-400';
  if (percent >= 10) return 'text-orange-400';
  return 'text-red-400';
}

export function getDifficultyGlow(percent: number): string {
  if (percent >= 70) return 'shadow-[0_0_20px_#4ade80]';
  if (percent >= 35) return 'shadow-[0_0_20px_#facc15]';
  if (percent >= 10) return 'shadow-[0_0_20px_#fb923c]';
  return 'shadow-[0_0_20px_#f87171]';
}
