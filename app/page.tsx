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
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

import AuthButtons from "../components/AuthButtons";
import BirthYearInput from "../components/BirthYearInput";
import ContributionForm from "../components/ContributionForm";
import Summary from "../components/Summary";
import RecordsList from "../components/RecordsList";
import ImportantNotice from "../components/ImportantNotice";
import ContributionGraph from "../components/ContributionGraph";
import Loading from "../components/Loading";
import { useToast } from "../components/ToastProvider";
import { useSound } from "../components/SoundProvider";

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
  const [amount, setAmount] = useState(1000);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"contribution" | "withdrawal">("contribution");
  const [birthYear, setBirthYear] = useState(1990);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "contributions"),
      where("uid", "==", user.uid),
      orderBy("date", "desc")
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
        })
      );
      setItemsLoading(false);
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
      toast({ variant: "success", title: "Saved", description: "Record added." });
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Could not add record." });
    }
  }

  async function removeItem(id: string) {
    try {
  await deleteDoc(doc(db, "contributions", id));
  play("remove");
      toast({ variant: "success", title: "Removed", description: "Record deleted." });
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Could not delete record." });
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
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Contribs</h1>
          <AuthButtons user={user} />
        </header>
        <section className="grid gap-3 sm:gap-4">
          <BirthYearInput user={user} birthYear={birthYear} setBirthYear={setBirthYear} />
          <ContributionForm
            amount={amount}
            setAmount={setAmount}
            date={date}
            setDate={setDate}
            type={type}
            setType={(val: string) => setType(val as "contribution" | "withdrawal")}
            addItem={addItem}
          />
          <Summary items={items} birthYear={birthYear} />
          <ContributionGraph items={items} />
          <RecordsList items={items} removeItem={removeItem} />
          <ImportantNotice />
        </section>
      </div>
    </div>
  );
}
