import { Suspense } from "react";
import RequireLogin from "@/components/RequireLogin";
import RouteBuilder from "@/components/route/RouteBuilder";

export const metadata = {
  title: "Plan a Trip | L.A.R.P",
};

export default function PlanPage() {
  return (
    <Suspense>
      <RequireLogin message="Log in to build a route and keep track of your budget.">
        <RouteBuilder />
      </RequireLogin>
    </Suspense>
  );
}
