import { Suspense } from "react";
import RequireLogin from "@/components/RequireLogin";
import TripsView from "@/components/trips/TripsView";

export const metadata = {
  title: "My Trips | L.A.R.P",
};

export default function TripsPage() {
  return (
    <Suspense>
      <RequireLogin message="Log in to see your saved trips.">
        <TripsView />
      </RequireLogin>
    </Suspense>
  );
}
