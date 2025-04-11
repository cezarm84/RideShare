import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
