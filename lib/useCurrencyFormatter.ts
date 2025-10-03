"use client";
import { useSyncExternalStore } from "react";
import {
  __subscribeCurrency,
  getCurrentCurrencyCode,
  getCurrentRate,
} from "./format";

export function useCurrencyFormatter() {
  const code = useSyncExternalStore(
    (cb) => __subscribeCurrency(cb),
    () => getCurrentCurrencyCode(),
  );
  const rate = getCurrentRate();
  return { code, rate };
}
