"use client";

// Temporary home page: shows whether you're logged in, so you can check
// Part 2 works. Replace it with the real homepage from Figma in Parts 3-4.

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import PlaceList from "@/components/PlaceList";
import TripList from "@/components/TripList";

export default function Home() {
  const { user, loading, logout } = useAuth();

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-4 py-12 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">L.A.R.P</h1>
      <p className="max-w-md text-muted-foreground">Local Adventure Route Planner</p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : user ? (
        <div className="flex flex-col items-center gap-3">
          <p>
            Logged in as <span className="font-medium">{user.display_name || user.username}</span>
          </p>
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Log in
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Sign up
          </Link>
        </div>
      )}

      <TripList />
      <PlaceList />
    </main>
  );
}
