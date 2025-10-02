"use client";

import { auth } from "../lib/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";

export default function AuthButtons({ user }: { user: User | null }) {
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--ws-muted)]">
          Hi, {user.displayName || user.email}
        </span>
        <a
          href="/account"
          className="px-3 py-1.5 rounded-md border border-[var(--ws-border)] text-[var(--ws-text)] hover:bg-[var(--ws-hover)] transition cursor-pointer"
        >
          Account
        </a>
        <button
          onClick={() => signOut(auth)}
          className="px-3 py-1.5 rounded-md border border-[var(--ws-border)] text-[var(--ws-text)] hover:bg-[var(--ws-hover)] transition cursor-pointer"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
      className="px-4 py-2 rounded-md bg-[var(--ws-accent)] text-white hover:bg-[var(--ws-accent-600)] transition cursor-pointer shadow-sm"
    >
      Continue with Google
    </button>
  );
}
