/** Giorni prima della scadenza in cui attivare l'avviso in dashboard */
export const DOCUMENT_EXPIRY_ALERT_DAYS_BEFORE = 7;

export interface DocumentExpiryAlertFields {
  expiryDate?: string;
  expiryAlertEnabled?: boolean;
}

export function formatIsoDateOnly(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function daysUntilIsoDate(dateStr: string): number {
  const iso = formatIsoDateOnly(dateStr);
  if (!iso) return 9999;
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isExpiryAlertActive(doc: DocumentExpiryAlertFields): boolean {
  if (!doc.expiryDate?.trim()) return false;
  if (doc.expiryAlertEnabled !== true) return false;
  const days = daysUntilIsoDate(doc.expiryDate);
  return days <= DOCUMENT_EXPIRY_ALERT_DAYS_BEFORE;
}

export function expiryAlertSeverity(doc: DocumentExpiryAlertFields): 'expired' | 'urgent' | 'warning' | null {
  if (!isExpiryAlertActive(doc)) return null;
  const days = daysUntilIsoDate(doc.expiryDate!);
  if (days < 0) return 'expired';
  if (days <= 3) return 'urgent';
  return 'warning';
}
