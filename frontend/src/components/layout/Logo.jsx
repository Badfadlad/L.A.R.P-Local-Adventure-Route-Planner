import Link from "next/link";

export default function Logo({ showTagline = true }) {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="L.A.R.P home">
      <span className="font-heading text-2xl font-bold tracking-tight text-brand">L.A.R.P</span>
      {showTagline && (
        <span className="hidden border-l border-border pl-3 text-[0.65rem] font-medium tracking-[0.2em] text-muted-foreground uppercase lg:inline">
          Local Adventure Route Planner
        </span>
      )}
    </Link>
  );
}
