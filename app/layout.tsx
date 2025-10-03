import "./globals.css";
import React, { ReactNode } from "react";
import ToastProvider from "../components/ToastProvider";
import { CurrencyProvider } from "../components/CurrencyProvider";

export const metadata = {
  title: "Contribs - TFSA Tracker",
  description: "Track your TFSA contributions and withdrawals",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[var(--ws-bg)] text-[var(--ws-text)] overflow-x-hidden">
        <ToastProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
