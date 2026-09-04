/** Display helpers. Costa Rican conventions: ₡ with dot thousands separators. */

const groupedFormatter = new Intl.NumberFormat("es-CR", { maximumFractionDigits: 0 });

/**
 * Group digits the way Costa Rica actually writes them.
 *
 * ICU's `es-CR` locale groups with U+00A0 (a non-breaking space), rendering
 * ₡12 500. Everyday Costa Rican usage — and the Dos Tazas POS receipts — write
 * ₡12.500 with a dot, so the separator is normalized rather than taken from
 * the locale data.
 */
function groupWithDots(value: number): string {
  return groupedFormatter.format(value).replace(/[\u00a0\u202f\s]/g, ".");
}

export function formatColones(amount: number): string {
  return `₡${groupWithDots(Math.round(amount))}`;
}

/** 102345678 -> 1-2345-6789 */
export function formatNationalId(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

/**
 * 102345678 -> 1-****-6789
 *
 * Used on the printed card. The card is a physical object that gets left on
 * counters and photographed, so it shows enough for the owner to recognize it
 * and not enough to be worth reading off someone else's table.
 */
export function maskNationalId(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 5) return "•".repeat(digits.length);
  if (digits.length === 9) {
    return `${digits.slice(0, 1)}-****-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 2)}${"*".repeat(digits.length - 6)}${digits.slice(-4)}`;
}

/** 88887777 -> 8888 7777 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return digits;
}

export function formatPoints(points: number): string {
  return groupWithDots(points);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
