// Shared utilities for Mashed

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function isValidMessage(content: string): boolean {
  return content.trim().length > 0 && content.length <= 1000;
}
