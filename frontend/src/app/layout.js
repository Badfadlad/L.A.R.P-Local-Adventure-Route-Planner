// Fonts are self-hosted from npm (@fontsource) instead of next/font/google,
// so the app builds offline / inside Docker and never calls Google at runtime.
import "@fontsource-variable/geist";
import "@fontsource-variable/outfit";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import SiteHeader from "@/components/layout/SiteHeader";
import MobileTabBar from "@/components/layout/MobileTabBar";

export const metadata = {
  title: "L.A.R.P",
  description: "Local Adventure Route Planner: discover places, plan routes and track trip costs.",
};

// Makes the layout scale correctly on phones (Part 4: responsive design).
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6d3be0",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <AuthProvider>
          <SiteHeader />
          <div id="main" className="pb-tabbar flex flex-1 flex-col">
            {children}
          </div>
          <MobileTabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
