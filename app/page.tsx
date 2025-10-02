"use client";

import React, { useEffect, useState } from "react";
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
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

import AuthButtons from "../components/AuthButtons";
import BirthYearInput from "../components/BirthYearInput";
import CashBalanceInput from "../components/CashBalanceInput";
import ContributionForm from "../components/ContributionForm";
import Summary from "../components/Summary";
import RecordsList from "../components/RecordsList";
import ImportantNotice from "../components/ImportantNotice";
import ContributionGraph from "../components/ContributionGraph";
import Loading from "../components/Loading";
import { useToast } from "../components/ToastProvider";
import { useSound } from "../components/SoundProvider";
import HoldingsForm from "../components/HoldingsForm";
import HoldingsList, { type Holding } from "../components/HoldingsList";

interface ContributionItem {
  id: string;
  uid: string;
  type: "contribution" | "withdrawal";
  amount: number;
  date: string;
  createdAt: number;
}

export default function HomePage() {
  const { toast } = useToast();
  const { play } = useSound();
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

  useEffect(() => {
    if (!user) return;
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
        amount: Number(amount),
        date,
        type,
        createdAt: Date.now(),
      });
      setAmount(1000);
      play("add");
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
      play("add");
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
      play("remove");
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
      play("remove");
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--ws-bg)] text-[var(--ws-text)]">
        <AuthButtons user={null} />
      </div>
    );
  }

  if (itemsLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between py-2 sm:py-3">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Contribs
          </h1>
          <AuthButtons user={user} />
        </header>
        <section className="grid gap-3 sm:gap-4">
          <BirthYearInput
            user={user}
            birthYear={birthYear}
            setBirthYear={setBirthYear}
          />
          <CashBalanceInput
            user={user}
            cash={cashBalance}
            setCash={setCashBalance}
          />
          <ContributionForm
            amount={amount}
            setAmount={setAmount}
            date={date}
            setDate={setDate}
            type={type}
            setType={(val: string) =>
              setType(val as "contribution" | "withdrawal")
            }
            addItem={addItem}
          />
          <Summary
            items={items}
            birthYear={birthYear}
            portfolioValue={portfolioValue + cashBalance}
            hasHoldings={holdings.length > 0}
            cashBalance={cashBalance}
          />
          <HoldingsForm onAdd={addHolding} />
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
              />
            );
          })()}
          <ContributionGraph items={items} />
          <RecordsList items={items} removeItem={removeItem} />
          <ImportantNotice />
        </section>
      </div>
    </div>
  );
}
