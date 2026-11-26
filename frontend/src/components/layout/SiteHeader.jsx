"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import Logo from "./Logo";
import { NAV_LINKS, isActive } from "./nav";

/**
 * Top bar on every page.
 * - Desktop (md and up): logo, links, and Get started / Log out.
 * - Mobile: logo and a "Menu" button that opens a side sheet.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                isActive(pathname, link.href) && "text-brand hover:text-brand"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : isAuthenticated ? (
            <>
              <span className="max-w-32 truncate text-sm text-muted-foreground" title={user.username}>
                @{user.username}
              </span>
              <Button variant="outline" size="lg" onClick={logout}>
                <LogOut aria-hidden="true" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                Log in
              </Link>
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-4")}>
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogTrigger
            render={<Button variant="ghost" size="lg" className="md:hidden" />}
            aria-label="Open menu"
          >
            <Menu aria-hidden="true" />
            Menu
          </DialogTrigger>
          <DialogContent side="right" className="gap-6 pt-14">
            <DialogTitle className="sr-only">Menu</DialogTitle>
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <DialogClose
                  key={link.href}
                  render={
                    <Link
                      href={link.href}
                      aria-current={isActive(pathname, link.href) ? "page" : undefined}
                      className={cn(
                        "rounded-lg px-3 py-3 text-base font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                        isActive(pathname, link.href) && "bg-brand-soft text-brand"
                      )}
                    />
                  }
                >
                  {link.label}
                </DialogClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
              {isAuthenticated ? (
                <>
                  <p className="text-sm text-muted-foreground">Signed in as @{user.username}</p>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                  >
                    <LogOut aria-hidden="true" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <DialogClose render={<Link href="/register" className={buttonVariants({ size: "lg" })} />}>
                    Get started
                  </DialogClose>
                  <DialogClose render={<Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })} />}>
                    Log in
                  </DialogClose>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
