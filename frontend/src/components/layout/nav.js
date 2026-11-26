import { Compass, House, Route, CircleUser, Map } from "lucide-react";

// Desktop header links (Figma: Discover · Plan a Trip · My Trips · Profile).
export const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/plan", label: "Plan a Trip" },
  { href: "/trips", label: "My Trips" },
  { href: "/profile", label: "Profile" },
];

// Mobile bottom tab bar (Figma mobile: Home · Explore · Trips · My Profile).
export const TAB_LINKS = [
  { href: "/", label: "Home", icon: House },
  { href: "/discover", label: "Explore", icon: Compass },
  { href: "/plan", label: "Plan", icon: Route },
  { href: "/trips", label: "Trips", icon: Map },
  { href: "/profile", label: "Profile", icon: CircleUser },
];

/** "/discover" is active on "/discover" and "/discover/123", "/" only on "/". */
export function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname?.startsWith(`${href}/`);
}
