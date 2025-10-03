"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { auth, db } from "../lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  doc,
  orderBy,
  getDocs,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

import AuthButtons from "../components/AuthButtons";
import ContributionForm from "../components/ContributionForm";
import EmailPasswordSignIn from "../components/EmailPasswordSignIn";
import Summary from "../components/Summary";
import RecordsList from "../components/RecordsList";
import ImportantNotice from "../components/ImportantNotice";
import ContributionGraph from "../components/ContributionGraph";
import Loading from "../components/Loading";
import { useToast } from "../components/ToastProvider";
import HoldingsForm from "../components/HoldingsForm";
import HoldingsList, { type Holding } from "../components/HoldingsList";
import CurrencySelector from "../components/CurrencySelector";
import {
  convertPreferredToBase,
  formatCurrency,
  getCurrentCurrencyCode,
  convertBaseToPreferred,
} from "../lib/format";
import { useCurrency } from "../components/CurrencyProvider";
import Modal from "../components/Modal";

interface ContributionItem {
  id: string;
  uid: string;
  type: "contribution" | "withdrawal";
  amount: number;
  date: string;
  createdAt: number;
}

export default function HomePage() {
  const { preferred, rate } = useCurrency();
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [items, setItems] = useState<ContributionItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [amount, setAmount] = useState(1000);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"contribution" | "withdrawal">(
    "contribution",
  );
  const [birthYear, setBirthYear] = useState(1990);
  const [cashBalance, setCashBalance] = useState(0);
  const [marketDataUnavailable, setMarketDataUnavailable] = useState(false);
  const [openContribution, setOpenContribution] = useState(false);
  const [openHolding, setOpenHolding] = useState(false);
  const [openBirthYear, setOpenBirthYear] = useState(false);
  const [openCash, setOpenCash] = useState(false);
  const [cashEdit, setCashEdit] = useState<number>(0);
  const [quotesLoading, setQuotesLoading] = useState(false);

  useEffect(() => {
    setAmount((prev) => Number(prev));
    setCashEdit(convertBaseToPreferred(cashBalance));
  }, [preferred, rate, cashBalance]);
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    getDoc(userRef).then((snap) => {
      const by = snap.exists()
        ? (snap.data() as { birthYear?: number; currency?: string } | undefined)
            ?.birthYear
        : undefined;
      if (typeof by === "number") {
        setBirthYear(by);
      } else {
        setOpenBirthYear(true);
      }
      const cashBase = snap.exists()
        ? Number((snap.data() as { cash?: number } | undefined)?.cash ?? 0)
        : 0;
      setCashBalance(Number.isFinite(cashBase) ? cashBase : 0);
      setCashEdit(Number.isFinite(cashBase) ? cashBase : 0);
    });
    const q = query(
      collection(db, "contributions"),
      where("uid", "==", user.uid),
      orderBy("date", "desc"),
    );
    setItemsLoading(true);
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(
        snapshot.docs.map((d) => {
          const data = d.data() as unknown;
          const {
            uid = "",
            type = "contribution",
            amount = 0,
            date = "",
            createdAt = 0,
          } = data as Partial<ContributionItem>;
          return {
            id: d.id,
            uid,
            type: type as "contribution" | "withdrawal",
            amount: Number(amount),
            date,
            createdAt,
          };
        }),
      );
      setItemsLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "holdings"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setHoldings(
        snapshot.docs.map((d) => {
          const data = d.data() as unknown;
          const {
            uid = "",
            symbol = "",
            shares = 0,
            createdAt = 0,
          } = data as Partial<Holding> & {
            symbol?: string;
            shares?: number;
          };
          return {
            id: d.id,
            uid,
            symbol: String(symbol).toUpperCase(),
            shares: Number(shares),
            createdAt,
          } as Holding;
        }),
      );
    });
    return () => unsub();
  }, [user]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, "contributions"), {
        uid: user.uid,
        amount: Number(convertPreferredToBase(Number(amount))),
        date,
        type,
        createdAt: Date.now(),
      });
      setAmount(1000);
      toast({
        variant: "success",
        title: "Saved",
        description: "Record added.",
      });
    } catch {
      toast({
        variant: "error",
        title: "Error",
        description: "Could not add record.",
      });
    }
  }

  async function addHolding(symbol: string, shares: number) {
    if (!user) return;
    try {
      const normSymbol = String(symbol).toUpperCase();
      const res = await fetch(
        `/api/quote?symbol=${encodeURIComponent(normSymbol)}`,
      );
      if (!res.ok) {
        toast({
          variant: "error",
          title: "Invalid symbol",
          description: `${normSymbol} not found`,
        });
        return;
      }
      const holdingsCol = collection(db, "holdings");
      const existingQ = query(
        holdingsCol,
        where("uid", "==", user.uid),
        where("symbol", "==", normSymbol),
      );
      const existing = await getDocs(existingQ);
      if (!existing.empty) {
        const docRef = existing.docs[0].ref;
        const prevShares = Number(existing.docs[0].data()?.shares ?? 0);
        await updateDoc(docRef, { shares: prevShares + Number(shares) });
      } else {
        await addDoc(holdingsCol, {
          uid: user.uid,
          symbol: normSymbol,
          shares,
          createdAt: Date.now(),
        });
      }
      toast({
        variant: "success",
        title: "Holding saved",
        description: `${normSymbol} • +${shares} shares`,
      });
    } catch {
      toast({
        variant: "error",
        title: "Error",
        description: "Could not save holding.`",
      });
    }
  }

  async function removeHolding(id: string) {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "holdings", id));
      toast({ variant: "success", title: "Holding removed" });
    } catch {
      toast({
        variant: "error",
        title: "Error",
        description: "Could not remove holding",
      });
    }
  }

  async function removeItem(id: string) {
    try {
      await deleteDoc(doc(db, "contributions", id));
      toast({
        variant: "success",
        title: "Removed",
        description: "Record deleted.",
      });
    } catch {
      toast({
        variant: "error",
        title: "Error",
        description: "Could not delete record.",
      });
    }
  }

  if (authLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ws-bg)] text-[var(--ws-text)] p-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--ws-border)] bg-[var(--ws-card)] p-6 shadow-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <Image
              src="/images/logo.png"
              alt="Contribs"
              width={56}
              height={56}
              priority
            />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Contribs</h1>
              <p className="mt-1 text-sm text-[var(--ws-muted)]">
                Track TFSA contributions, holdings, and cash in one simple
                place.
              </p>
            </div>
            <div className="w-full pt-2 space-y-5">
              <div>
                <EmailPasswordSignIn />
              </div>
              <div className="relative flex items-center text-[10px] uppercase tracking-wide font-medium text-[var(--ws-muted)]">
                <span className="flex-1 h-px bg-[var(--ws-border)]" />
                <span className="px-3">or</span>
                <span className="flex-1 h-px bg-[var(--ws-border)]" />
              </div>
              <div>
                <AuthButtons user={null} />
              </div>
              <div className="text-center text-xs text-[var(--ws-muted)]">
                New here? {""}
                <a
                  href="/register"
                  className="text-[var(--ws-accent)] hover:underline"
                >
                  Create an account
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (itemsLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {quotesLoading && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--ws-bg)] text-[var(--ws-text)]">
            <div className="flex items-center gap-3">
              <div
                className="h-6 w-6 rounded-full border-2 border-[var(--ws-border)] border-t-[var(--ws-accent)] animate-spin"
                aria-label="Loading market data"
              />
              <span className="text-sm text-[var(--ws-muted)]">
                Loading market data…
              </span>
            </div>
          </div>
        )}
        <header className="flex items-center justify-between py-2 sm:py-3">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {(() => {
              const raw =
                user?.displayName || user?.email || user?.uid || "there";
              const first = String(raw).split("@")[0].split(" ")[0];
              return `Hello, ${first}`;
            })()}
          </h1>
          <div className="flex items-center gap-3">
            <CurrencySelector />
            <AuthButtons user={user} />
          </div>
        </header>
        <section className="grid gap-3 sm:gap-4">
          <Summary
            items={items}
            birthYear={birthYear}
            portfolioValue={portfolioValue + cashBalance}
            hasHoldings={holdings.length > 0}
            cashBalance={cashBalance}
            marketDataUnavailable={marketDataUnavailable}
          />
          <Modal
            open={openContribution}
            onClose={() => setOpenContribution(false)}
            title="Add record"
          >
            <ContributionForm
              amount={amount}
              setAmount={setAmount}
              date={date}
              setDate={setDate}
              type={type}
              setType={(val: string) =>
                setType(val as "contribution" | "withdrawal")
              }
              addItem={(e) => {
                addItem(e);
                setOpenContribution(false);
              }}
            />
          </Modal>
          <Modal
            open={openCash}
            onClose={() => setOpenCash(false)}
            title="Cash"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user) return;
                const userRef = doc(db, "users", user.uid);
                const baseValue = convertPreferredToBase(Number(cashEdit));
                await setDoc(
                  userRef,
                  { cash: Number(baseValue) },
                  { merge: true },
                );
                setCashBalance(Number(baseValue));
                setOpenCash(false);
              }}
              className="space-y-3"
            >
              <label className="block text-sm text-[var(--ws-muted)]">
                Cash balance
              </label>
              <input
                type="number"
                step="0.01"
                value={cashEdit}
                onChange={(e) => setCashEdit(Number(e.target.value))}
                className="mt-1 p-2 rounded-md border w-full sm:w-48 bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none focus:outline-none focus:ring-0"
                min={0}
              />
              <div className="text-xs text-[var(--ws-muted)]">
                Stored in CAD. Current:{" "}
                {formatCurrency(convertPreferredToBase(Number(cashEdit)))} (
                {getCurrentCurrencyCode()}).
              </div>
              <div className="pt-1 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setOpenCash(false)}
                  className="px-3 py-2 rounded-md border border-[var(--ws-border)] hover:bg-[var(--ws-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-md bg-[var(--ws-accent)] text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </Modal>
          <Modal
            open={openHolding}
            onClose={() => setOpenHolding(false)}
            title="Add holding"
          >
            <HoldingsForm
              onAdd={async (s, q) => {
                await addHolding(s, q);
                setOpenHolding(false);
              }}
            />
          </Modal>
          <Modal
            open={openBirthYear}
            onClose={() => setOpenBirthYear(false)}
            title="What's your birth year?"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user) return;
                const currentYear = new Date().getFullYear();
                if (birthYear < 1900 || birthYear > currentYear) return;
                await setDoc(
                  doc(db, "users", user.uid),
                  { birthYear },
                  { merge: true },
                );
                setOpenBirthYear(false);
              }}
              className="space-y-3"
            >
              <label className="block text-sm text-[var(--ws-muted)]">
                Birth year
              </label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(Number(e.target.value))}
                className="mt-1 p-2 rounded-md border w-full sm:w-40 bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none focus:outline-none focus:ring-0"
                min={1900}
                max={new Date().getFullYear()}
              />
              <div className="pt-1 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setOpenBirthYear(false)}
                  className="px-3 py-2 rounded-md border border-[var(--ws-border)] hover:bg-[var(--ws-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-md bg-[var(--ws-accent)] text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </Modal>
          {(() => {
            const netContributed = items.reduce(
              (sum, it) =>
                sum +
                (it.type === "contribution"
                  ? Number(it.amount)
                  : -Number(it.amount)),
              0,
            );
            return (
              <HoldingsList
                items={holdings}
                netContributed={netContributed}
                cashBalance={cashBalance}
                onRemove={removeHolding}
                onValueChange={setPortfolioValue}
                onMarketStatusChange={setMarketDataUnavailable}
                onAdd={() => setOpenHolding(true)}
                onAddCash={() => {
                  setCashEdit(Number(cashBalance));
                  setOpenCash(true);
                }}
                onLoadingChange={setQuotesLoading}
              />
            );
          })()}
          <ContributionGraph items={items} />
          <RecordsList
            items={items}
            removeItem={removeItem}
            onAdd={() => setOpenContribution(true)}
          />
          <ImportantNotice />
        </section>
      </div>
    </div>
  );
}
