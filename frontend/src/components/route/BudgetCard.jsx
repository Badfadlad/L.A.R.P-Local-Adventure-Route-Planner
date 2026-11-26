import { Bus, Pencil, Wallet } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCost } from "@/lib/places";

/** "Budget" card: each stop's cost, transportation, and how much is left. */
export default function BudgetCard({ budget, modeLabel = "Walking", onEditBudget }) {
  const over = budget.remaining != null && budget.remaining < 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="font-heading text-lg">Budget</CardTitle>
          <CardDescription>Estimated for one person</CardDescription>
        </div>
        {onEditBudget && (
          <Button variant="outline" size="sm" onClick={onEditBudget} aria-label="Edit budget">
            {budget.budget != null ? formatMoney(budget.budget) : "Set budget"}
            <Pencil aria-hidden="true" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3 text-sm">
          {budget.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <Wallet aria-hidden="true" className="size-4 shrink-0 text-brand" />
                <span className="truncate">{item.name}</span>
              </span>
              <span className={cn("font-semibold", !item.cost && "text-success")}>{formatCost(item.cost)}</span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Bus aria-hidden="true" className="size-4 text-brand" />
              Transportation <span className="text-muted-foreground">({modeLabel.toLowerCase()})</span>
            </span>
            <span className={cn("font-semibold", !budget.transportCost && "text-success")}>
              {formatCost(budget.transportCost)}
            </span>
          </li>
        </ul>
        <dl className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total budget</dt>
            <dd className="font-semibold">{budget.budget != null ? formatMoney(budget.budget) : "Not set"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Estimated total</dt>
            <dd className="font-semibold">{formatMoney(budget.total)}</dd>
          </div>
        </dl>
        {budget.remaining != null && (
          <div
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 font-semibold",
              over
                ? "bg-destructive/10 text-destructive"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            )}
          >
            <span>{over ? "Over budget" : "Remaining"}</span>
            <span className="text-xl">{formatMoney(Math.abs(budget.remaining))}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatMoney(n) {
  return `$${Number(n).toFixed(Number.isInteger(Number(n)) ? 0 : 2)}`;
}
