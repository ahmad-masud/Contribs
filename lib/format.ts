export const BASE_CURRENCY = "CAD";

let currentCurrencyCode: string = BASE_CURRENCY;
let currentRateBaseToPreferred = 1;

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {}
  });
}

export function __setCurrencyContext(
  preferredCode: string,
  rateBaseToPreferred: number,
) {
  if (!preferredCode) return;
  currentCurrencyCode = preferredCode.toUpperCase();
  currentRateBaseToPreferred =
    Number(rateBaseToPreferred) > 0 ? Number(rateBaseToPreferred) : 1;
  notify();
}

export function convertBaseToPreferred(amountBase: number) {
  return amountBase * currentRateBaseToPreferred;
}

export function convertPreferredToBase(amountPreferred: number) {
  return amountPreferred / currentRateBaseToPreferred;
}

export function formatCurrency(amountBase: number) {
  if (Number.isNaN(amountBase)) return "--";
  const converted = convertBaseToPreferred(Number(amountBase));
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currentCurrencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted);
  } catch {
    return `${currentCurrencyCode} ${converted.toFixed(2)}`;
  }
}

export function getCurrentCurrencyCode() {
  return currentCurrencyCode;
}

export function getCurrentRate() {
  return currentRateBaseToPreferred;
}

export function __subscribeCurrency(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
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
