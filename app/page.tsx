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

interface ContributionItem {
  id: string;
  uid: string;
  type: "contribution" | "withdrawal";
  amount: number;
  date: string;
  createdAt: number;
}

export default function HomePage() {
  const [user] = useAuthState(auth);
  const [items, setItems] = useState<ContributionItem[]>([]);
  const [amount, setAmount] = useState(1000);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"contribution" | "withdrawal">("contribution");
  const [birthYear, setBirthYear] = useState(1990);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "contributions"),
      where("uid", "==", user.uid),
      orderBy("date", "desc"),
    );
    return onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid ?? "",
          type: data.type ?? "contribution",
          amount: Number(data.amount) ?? 0,
          date: data.date ?? "",
          createdAt: data.createdAt ?? 0,
        };
      }));
    });
  }, [user]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    await addDoc(collection(db, "contributions"), {
      uid: user.uid,
      amount: Number(amount),
      date,
      type,
      createdAt: Date.now(),
    });
    setAmount(1000);
  }

  async function removeItem(id: string) {
    await deleteDoc(doc(db, "contributions", id));
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ws-bg)] text-[var(--ws-text)]">
        <AuthButtons user={null} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between py-3">
          <h1 className="text-2xl font-semibold tracking-tight">Contribs</h1>
          <AuthButtons user={user} />
        </header>
        <div className="bg-[var(--ws-card)] border border-[var(--ws-border)] rounded-xl shadow-sm p-6">
          <section className="grid gap-4">
            <BirthYearInput
              user={user}
              birthYear={birthYear}
              setBirthYear={setBirthYear}
            />
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
    </div>
  );
}
