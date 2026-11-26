import { Suspense } from "react";
import DiscoverView from "@/components/places/DiscoverView";

export const metadata = {
  title: "Discover | L.A.R.P",
};

// DiscoverView reads the URL (?chips=&q=), which Next.js needs wrapped in Suspense.
export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverView />
    </Suspense>
  );
}
