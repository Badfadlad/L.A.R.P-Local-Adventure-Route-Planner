/**
 * Integration tests: real components + AuthContext + api.js, with the network
 * (axios) faked by jest.mock so no backend is needed.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---- fake Next.js router
const push = jest.fn();
const replace = jest.fn();
let mockSearch = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => "/discover",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

// ---- fake the shared Axios instance in api.js
jest.mock("axios", () => {
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
  return { __esModule: true, default: { create: () => instance }, instance };
});
const { instance: http } = jest.requireMock("axios");

import { AuthProvider } from "@/context/AuthContext";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import DiscoverView from "@/components/places/DiscoverView";
import SiteHeader from "@/components/layout/SiteHeader";

const places = [
  { id: 1, name: "Balboa Park", category: "park", subcategory: "Gardens", city: "San Diego", estimated_cost: 0, latitude: 32.73, longitude: -117.14 },
  { id: 2, name: "The Prado", category: "food", subcategory: "Lunch", city: "San Diego", estimated_cost: 32, latitude: 32.73, longitude: -117.15 },
];
const me = { id: 9, username: "nutsa", email: "n@example.com", display_name: "Nutsa" };

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockSearch = "";
});

/** Route GET requests by URL. */
function mockGets(routes) {
  http.get.mockImplementation((url, config) => {
    const handler = routes[url];
    if (!handler) return Promise.reject({ response: { status: 404, data: { detail: "Not found" } } });
    return Promise.resolve({ data: typeof handler === "function" ? handler(config) : handler });
  });
}

describe("login flow", () => {
  test("logs in, saves the token and redirects home", async () => {
    mockGets({ "/auth/me": me });
    http.post.mockResolvedValueOnce({ data: { access_token: "abc.def.ghi" } });

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    await userEvent.type(screen.getByLabelText(/username or email/i), "nutsa");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(localStorage.getItem("token")).toBe("abc.def.ghi");
    // Backend expects OAuth2 form data, not JSON
    const [url, body, config] = http.post.mock.calls[0];
    expect(url).toBe("/auth/login");
    expect(body.toString()).toBe("username=nutsa&password=password123");
    expect(config.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
  });

  test("shows the backend's error on a wrong password", async () => {
    mockGets({});
    http.post.mockRejectedValueOnce({ response: { status: 401, data: { detail: "Incorrect username or password" } } });
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    await userEvent.type(screen.getByLabelText(/username or email/i), "nutsa");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass1");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect username or password");
    expect(localStorage.getItem("token")).toBeNull();
  });
});

describe("registration flow", () => {
  test("blocks a short password before calling the server", async () => {
    mockGets({});
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );
    await userEvent.type(screen.getByLabelText(/^username/i), "nutsa");
    await userEvent.type(screen.getByLabelText(/email/i), "n@example.com");
    await userEvent.type(screen.getByLabelText(/^password/i), "short");
    const confirm = screen.queryByLabelText(/confirm/i);
    if (confirm) await userEvent.type(confirm, "short");
    await userEvent.click(screen.getByRole("button", { name: /sign up|create account|register/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/8/);
    expect(http.post).not.toHaveBeenCalled();
  });
});

describe("Discover page (data fetching)", () => {
  test("loads places and filters by category chip", async () => {
    mockGets({ "/places": (config) => (config.params.category === "food" ? [places[1]] : places) });
    render(
      <AuthProvider>
        <DiscoverView />
      </AuthProvider>
    );
    expect(await screen.findByRole("heading", { name: "Balboa Park" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The Prado" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Food" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Balboa Park" })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "The Prado" })).toBeInTheDocument();
    expect(http.get).toHaveBeenLastCalledWith("/places", { params: { category: "food", limit: 50 } });
  });

  test("filters from the homepage URL are applied", async () => {
    mockSearch = "chips=park,under25";
    mockGets({ "/places": [places[0]] });
    render(
      <AuthProvider>
        <DiscoverView />
      </AuthProvider>
    );
    await screen.findByRole("heading", { name: "Balboa Park" });
    expect(http.get).toHaveBeenCalledWith("/places", { params: { category: "park", max_cost: 25, limit: 50 } });
    expect(screen.getByRole("button", { name: "Parks" })).toHaveAttribute("aria-pressed", "true");
  });

  test("search box sends a cleaned-up query", async () => {
    mockGets({ "/places": [] });
    render(
      <AuthProvider>
        <DiscoverView />
      </AuthProvider>
    );
    await userEvent.type(screen.getByRole("searchbox", { name: /search places/i }), "  garden  ");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() =>
      expect(http.get).toHaveBeenLastCalledWith("/places", { params: { q: "garden", limit: 50 } })
    );
    expect(await screen.findByText(/no places match/i)).toBeInTheDocument();
  });

  test("Add Stop sends logged-out users to the login page", async () => {
    mockGets({ "/places": places });
    render(
      <AuthProvider>
        <DiscoverView />
      </AuthProvider>
    );
    await userEvent.click(await screen.findByRole("button", { name: /add balboa park as a stop/i }));
    expect(push).toHaveBeenCalledWith("/login");
  });

  test("logged in: Add Stop creates a trip and adds the place", async () => {
    localStorage.setItem("token", `x.${btoa(JSON.stringify({ exp: Date.now() / 1000 + 600 }))}.y`);
    mockGets({ "/auth/me": me, "/places": places, "/bookmarks": [] });
    http.post.mockImplementation((url) =>
      Promise.resolve({ data: url === "/trips" ? { id: 42, status: "planned", stops: [] } : { id: 1 } })
    );

    render(
      <AuthProvider>
        <DiscoverView />
      </AuthProvider>
    );
    await userEvent.click(await screen.findByRole("button", { name: /add the prado as a stop/i }));

    expect(await screen.findByText(/The Prado was added to your trip/)).toBeInTheDocument();
    expect(http.post).toHaveBeenCalledWith("/trips", expect.objectContaining({ destination: "San Diego, CA" }));
    expect(http.post).toHaveBeenCalledWith("/trips/42/stops", { place_id: 2 });
    expect(localStorage.getItem("activeTripId")).toBe("42");
    expect(screen.getByRole("link", { name: /view your route/i })).toHaveAttribute("href", "/plan");
  });
});

describe("header", () => {
  test("logged out: shows Get started", async () => {
    mockGets({});
    render(
      <AuthProvider>
        <SiteHeader />
      </AuthProvider>
    );
    expect(await screen.findByRole("link", { name: "Get started" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "Discover" })).toHaveAttribute("aria-current", "page");
  });

  test("logged in: shows the username and logs out", async () => {
    localStorage.setItem("token", `x.${btoa(JSON.stringify({ exp: Date.now() / 1000 + 600 }))}.y`);
    mockGets({ "/auth/me": me });
    render(
      <AuthProvider>
        <SiteHeader />
      </AuthProvider>
    );
    expect(await screen.findByText("@nutsa")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /log out/i })[0]);
    expect(localStorage.getItem("token")).toBeNull();
    expect(await screen.findByRole("link", { name: "Get started" })).toBeInTheDocument();
  });
});
