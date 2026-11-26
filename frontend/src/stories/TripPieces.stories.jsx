import { fn } from "storybook/test";
import TripCard from "@/components/trips/TripCard";
import BudgetCard from "@/components/route/BudgetCard";
import TripSummaryCard from "@/components/route/TripSummaryCard";
import TravelModeTabs from "@/components/route/TravelModeTabs";
import MapPreview from "@/components/places/MapPreview";
import FilterChips from "@/components/places/FilterChips";
import { buildBudget, routeTotals } from "@/lib/route";
import { balboa, coffee, prado, stops, trip, zoo } from "./fixtures";

const meta = { title: "Trips/Pieces" };

export const PlannedTrip = {
  render: () => <div className="max-w-md"><TripCard trip={trip} onComplete={fn()} onDelete={fn()} /></div>,
};
export default meta;
export const CompletedTrip = {
  render: () => <div className="max-w-md"><TripCard trip={{ ...trip, status: "completed" }} onDelete={fn()} /></div>,
};
export const BudgetUnder = {
  render: () => <div className="max-w-sm"><BudgetCard budget={buildBudget(stops, { budget: 100 })} onEditBudget={fn()} /></div>,
};
export const BudgetOver = {
  render: () => <div className="max-w-sm"><BudgetCard budget={buildBudget(stops, { budget: 30, mode: "driving" })} modeLabel="Driving" /></div>,
};
export const Summary = {
  render: () => {
    const t = routeTotals(stops.map((s) => s.place));
    return <div className="max-w-sm"><TripSummaryCard dateLabel="Saturday, October 17" stopCount={3} minutes={t.minutes} miles={t.miles} finish={15 * 60 + 30} /></div>;
  },
};
export const TravelModes = {
  render: () => <div className="max-w-md"><TravelModeTabs value="walking" onChange={fn()} /></div>,
};
export const DiscoverMap = {
  render: () => <div className="h-80 max-w-lg"><MapPreview places={[balboa, coffee, prado, zoo]} highlightId={1} /></div>,
};
export const RouteMap = {
  render: () => <div className="h-80 max-w-lg"><MapPreview places={[coffee, balboa, prado]} route /></div>,
};
export const Filters = {
  render: () => <FilterChips active={["park", "under25"]} onToggle={fn()} />,
};
