"use client";

// Homepage from the Figma design (Part 4). The text box turns what you type
// ("a relaxed Saturday under $80, parks and lunch") into Discover filters
// and a trip budget. Arjay's TripList and PlaceList (Part 3) sit below it.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PlaceList from "@/components/PlaceList";
import TripList from "@/components/TripList";
import { parsePlanPrompt } from "@/lib/places";
import { setPendingBudget } from "@/lib/activeTrip";
import { sanitizeText } from "@/lib/validation";

const QUICK_PICKS = [
  { label: "Parks + lunch", text: "Parks and lunch in Balboa Park under $60" },
  { label: "Sunny afternoon", text: "A sunny afternoon at the beach, free" },
  { label: "Date night", text: "Date night with dinner and a sunset view under $100" },
];

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function planMyDay(e) {
    e.preventDefault();
    const { chips, budget } = parsePlanPrompt(sanitizeText(prompt, 300));
    setPendingBudget(budget);
    const params = new URLSearchParams();
    if (chips.length) params.set("chips", chips.join(","));
    if (budget) params.set("budget", String(budget));
    router.push(`/discover${params.size ? `?${params}` : ""}`);
  }

  return (
    <main className="flex flex-1 flex-col">
      <section
        aria-labelledby="hero-title"
        className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center md:min-h-[44rem]"
      >
        {/* Background photo with a light wash so the dark text stays readable */}
        <div
          aria-hidden="true"
          className="absolute -inset-4 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero.jpg)" }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-white/60 dark:bg-black/60" />

        <h1
          id="hero-title"
          className="max-w-3xl font-display text-5xl leading-[1.02] font-semibold tracking-tight text-balance text-slate-900 sm:text-6xl lg:text-7xl dark:text-white"
        >
          Plan a day worth leaving home for.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-700 dark:text-slate-200">
          Tell L.A.R.P what you want to do. We&apos;ll help you build the route.
        </p>

        <form
          onSubmit={planMyDay}
          className="mt-10 w-full max-w-3xl rounded-3xl bg-white/95 p-5 text-left shadow-xl ring-1 ring-black/5 sm:p-7 dark:bg-slate-900/95"
        >
          <Label htmlFor="plan-prompt" className="font-heading text-lg font-semibold sm:text-xl">
            What kind of day do you want?
          </Label>
          <Textarea
            id="plan-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={300}
            placeholder="A relaxed Saturday in San Diego under $80. Add parks, coffee, lunch, or anything you love."
            className="mt-3 min-h-24 resize-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" size="lg" className="h-11 rounded-full px-6 text-base">
              <Sparkles aria-hidden="true" />
              Plan my day
            </Button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {QUICK_PICKS.map((pick) => (
            <button
              key={pick.label}
              type="button"
              onClick={() => setPrompt(pick.text)}
              className="rounded-full bg-brand-soft/90 px-5 py-2 text-sm font-medium text-brand shadow-sm transition-colors outline-none hover:bg-white focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-base"
            >
              {pick.label}
            </button>
          ))}
        </div>

        <p className="mt-12 max-w-xs text-[0.7rem] font-medium tracking-[0.2em] text-balance text-slate-700 uppercase sm:max-w-none sm:text-sm sm:tracking-[0.25em] dark:text-slate-300">
          Find places <span aria-hidden="true">/</span> Build a route <span aria-hidden="true">/</span> Keep your
          spending in view
        </p>
      </section>

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 py-14 sm:px-6">
        <TripList />
        <PlaceList />
      </section>
    </main>
  );
}
