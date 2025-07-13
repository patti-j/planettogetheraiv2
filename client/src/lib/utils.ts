import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOperationStatus(status: string): string {
  switch (status) {
    case "in_progress":
      return "In-Process";
    case "completed":
      return "Completed";
    case "planned":
      return "Planned";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
