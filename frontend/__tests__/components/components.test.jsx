import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlaceCard from "@/components/places/PlaceCard";
import FilterChips from "@/components/places/FilterChips";
import MapPreview from "@/components/places/MapPreview";
import StarRating from "@/components/profile/StarRating";
import ReviewForm from "@/components/profile/ReviewForm";
import TripCard from "@/components/trips/TripCard";
import BudgetCard from "@/components/route/BudgetCard";
import TravelModeTabs from "@/components/route/TravelModeTabs";
import { buildBudget } from "@/lib/route";

const balboa = {
  id: 1,
  name: "Balboa Park",
  category: "park",
  subcategory: "Gardens",
  neighborhood: "Balboa Park",
  city: "San Diego",
  estimated_cost: 0,
  latitude: 32.7341,
  longitude: -117.1446,
  average_rating: 4.5,
  review_count: 2,
};

describe("PlaceCard", () => {
  test("shows the place and calls onAdd", async () => {
    const onAdd = jest.fn();
    render(<PlaceCard place={balboa} onAdd={onAdd} />);
    expect(screen.getByRole("heading", { name: "Balboa Park" })).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /add balboa park as a stop/i }));
    expect(onAdd).toHaveBeenCalledWith(balboa);
  });

  test("added places can't be added twice", () => {
    render(<PlaceCard place={balboa} onAdd={jest.fn()} added />);
    expect(screen.getByRole("button", { name: /is in your trip/i })).toBeDisabled();
  });

  test("bookmark button reports its state", async () => {
    const onToggle = jest.fn();
    render(<PlaceCard place={balboa} onToggleBookmark={onToggle} bookmarked />);
    const button = screen.getByRole("button", { name: /remove balboa park from bookmarks/i });
    expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);
    expect(onToggle).toHaveBeenCalledWith(balboa);
  });

  test("uses the local photo for known places", () => {
    render(<PlaceCard place={balboa} />);
    expect(screen.getByRole("img", { name: "Balboa Park" })).toHaveAttribute("src", "/images/places/balboa-park.jpg");
  });
});

describe("FilterChips", () => {
  test("chips are toggle buttons", async () => {
    const onToggle = jest.fn();
    render(<FilterChips active={["park"]} onToggle={onToggle} />);
    expect(screen.getByRole("button", { name: "Parks" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Food" })).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(screen.getByRole("button", { name: "Under $25" }));
    expect(onToggle).toHaveBeenCalledWith("under25");
  });
});

describe("MapPreview", () => {
  test("describes the places for screen readers", () => {
    render(<MapPreview places={[balboa, { ...balboa, id: 2, name: "The Prado", latitude: 32.73 }]} route />);
    expect(screen.getByRole("img", { name: /2 places in route order: Balboa Park, The Prado/ })).toBeInTheDocument();
  });

  test("empty map says so", () => {
    render(<MapPreview places={[]} />);
    expect(screen.getByRole("img", { name: /no places/i })).toBeInTheDocument();
  });
});

describe("StarRating", () => {
  test("click and arrow keys change the rating", async () => {
    const onChange = jest.fn();
    const { rerender } = render(<StarRating value={0} onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(onChange).toHaveBeenLastCalledWith(4);

    rerender(<StarRating value={4} onChange={onChange} />);
    expect(screen.getByRole("radio", { name: "4 stars" })).toHaveAttribute("aria-checked", "true");
    screen.getByRole("radio", { name: "4 stars" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  test("read-only mode is a single labelled image", () => {
    render(<StarRating value={3} readOnly />);
    expect(screen.getByRole("img", { name: "3 out of 5 stars" })).toBeInTheDocument();
  });
});

describe("ReviewForm", () => {
  test("won't submit without a rating", async () => {
    const onSubmit = jest.fn();
    render(<ReviewForm place={balboa} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: "Submit Review" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/rating/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("submits a cleaned-up review", async () => {
    const onSubmit = jest.fn().mockResolvedValue();
    render(<ReviewForm place={balboa} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    await userEvent.type(screen.getByLabelText(/write a short review/i), "  Loved the gardens!  ");
    await userEvent.click(screen.getByRole("button", { name: "Submit Review" }));
    expect(onSubmit).toHaveBeenCalledWith({ rating: 5, comment: "Loved the gardens!" });
  });

  test("shows the server's error message", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Place not found"));
    render(<ReviewForm place={balboa} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("radio", { name: "3 stars" }));
    await userEvent.click(screen.getByRole("button", { name: "Submit Review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Place not found");
  });
});

describe("TripCard", () => {
  const trip = {
    id: 5,
    name: "San Diego Saturday",
    trip_date: "2026-10-17",
    destination: "San Diego, CA",
    status: "planned",
    stop_count: 4,
    estimated_total: 60,
  };

  test("shows the trip summary and links to it", () => {
    render(<TripCard trip={trip} />);
    expect(screen.getByText("4 Stops")).toBeInTheDocument();
    expect(screen.getByText("$60 Estimated")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open trip san diego saturday/i })).toHaveAttribute("href", "/plan?trip=5");
  });

  test("planned trips can be completed, completed trips show a badge", async () => {
    const onComplete = jest.fn();
    const { rerender } = render(<TripCard trip={trip} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole("button", { name: /mark completed/i }));
    expect(onComplete).toHaveBeenCalledWith(trip);

    rerender(<TripCard trip={{ ...trip, status: "completed" }} onComplete={onComplete} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark completed/i })).not.toBeInTheDocument();
  });
});

describe("BudgetCard", () => {
  test("shows remaining money, or how much you're over", () => {
    const stops = [{ id: 1, place: { name: "The Prado" }, cost: 32 }];
    const { rerender } = render(<BudgetCard budget={buildBudget(stops, { budget: 100 })} />);
    expect(screen.getByText("Remaining")).toBeInTheDocument();
    expect(screen.getByText("$68")).toBeInTheDocument();

    rerender(<BudgetCard budget={buildBudget(stops, { budget: 20 })} />);
    expect(screen.getByText("Over budget")).toBeInTheDocument();
  });
});

describe("TravelModeTabs", () => {
  test("is a radio group", async () => {
    const onChange = jest.fn();
    render(<TravelModeTabs value="walking" onChange={onChange} />);
    const group = screen.getByRole("radiogroup", { name: /how you'll get around/i });
    expect(within(group).getByRole("radio", { name: /walking/i })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(within(group).getByRole("radio", { name: /transit/i }));
    expect(onChange).toHaveBeenCalledWith("transit");
  });
});
