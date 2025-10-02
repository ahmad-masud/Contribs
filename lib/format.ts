export const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(n: number) {
  if (Number.isNaN(n)) return "--";
  return currency.format(n);
}

export function formatDate(d: string | number | Date) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
