"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "firebase/auth";

export default function BirthYearInput({
  user,
  birthYear,
  setBirthYear,
}: {
  user: User | null;
  birthYear: number;
  setBirthYear: (val: number) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    let mounted = true;

    getDoc(userRef)
      .then((snapshot) => {
        if (!mounted) return;
        const v = snapshot.exists()
          ? (snapshot.data()?.birthYear ?? 1990)
          : 1990;
        prevRef.current = v;
        setBirthYear(v);
      })
      .finally(() => mounted && setLoaded(true));

    return () => {
      mounted = false;
    };
  }, [user, setBirthYear]);

  useEffect(() => {
    if (!user || !loaded) return;
    if (prevRef.current === birthYear) return;

    const userRef = doc(db, "users", user.uid);
    setDoc(userRef, { birthYear }, { merge: true }).then(() => {
      prevRef.current = birthYear;
    });
  }, [birthYear, loaded, user]);

  return (
    <div className="p-4 bg-[var(--ws-card)] border border-[var(--ws-border)] rounded-lg">
      <label className="block text-sm text-[var(--ws-muted)]">Birth year</label>
      <input
        type="number"
        value={birthYear}
        onChange={(e) => setBirthYear(Number(e.target.value))}
        className="mt-1 p-2 rounded-md border w-40 bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none focus:outline-none focus:ring-0"
      />
    </div>
  );
}
