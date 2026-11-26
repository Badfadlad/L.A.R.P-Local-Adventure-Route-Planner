"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatClock, formatDuration } from "@/lib/route";

/** "Day schedule": the whole day in order, with an Export (print / save as PDF) button. */
export default function DaySchedule({ stops, schedule }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="font-heading text-lg">Day schedule</CardTitle>
          <CardDescription>Your complete itinerary for the day.</CardDescription>
        </div>
        <Button size="sm" onClick={() => window.print()} className="print:hidden">
          <Printer aria-hidden="true" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {stops.map((stop, i) => {
            const s = schedule[i];
            return (
              <li key={stop.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{stop.place.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatClock(s.arrive)} - {formatClock(s.depart)} · {formatDuration(s.duration)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
