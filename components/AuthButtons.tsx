"use client";

import { auth } from "../lib/firebase";
import Link from "next/link";
import Image from "next/image";
import { BoxArrowRight } from "react-bootstrap-icons";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";

export default function AuthButtons({ user }: { user: User | null }) {
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/account"
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--ws-border)] bg-[var(--ws-card)] hover:bg-[var(--ws-hover)] transition cursor-pointer overflow-hidden"
          aria-label="Account"
          title={user.displayName || user.email || "Account"}
        >
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || user.email || "Profile"}
              fill
              sizes="36px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-sm font-medium text-[var(--ws-text)] bg-[var(--ws-muted-card)]">
              {(user.displayName || user.email || "?")
                .slice(0, 1)
                .toUpperCase()}
            </span>
          )}
        </Link>
        <button
          onClick={() => signOut(auth)}
          aria-label="Logout"
          title="Logout"
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-[var(--ws-border)] text-[var(--ws-text)] bg-[var(--ws-card)] hover:bg-[var(--ws-hover)] transition cursor-pointer"
        >
          <BoxArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
      aria-label="Continue with Google"
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8fafc] active:bg-[#f1f3f4] transition cursor-pointer shadow-sm"
    >
      <Image
        src="/images/google.png"
        alt="Google"
        width={18}
        height={18}
        priority
      />
      <span>Continue with Google</span>
    </button>
  );
}
