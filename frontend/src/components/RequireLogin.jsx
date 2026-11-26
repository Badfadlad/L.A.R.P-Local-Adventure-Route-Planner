"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

/**
 * Wrap a page that needs a logged-in user. Shows a loading state while we
 * check the saved token, and a friendly "please log in" card otherwise.
 */
export default function RequireLogin({ children, message = "Log in to see this page." }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Lock aria-hidden="true" className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold">You&apos;re not logged in</h1>
        <p className="text-muted-foreground">{message}</p>
        <div className="flex gap-3">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Log in
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
