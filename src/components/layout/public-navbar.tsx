"use client";

import { useState } from "react";
import { Menu, X, LifeBuoy, Phone, Sun, Moon } from "lucide-react";
import { LogoButton } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useApp } from "@/lib/store";
import { PUBLIC_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const { view, navigate, theme, toggleTheme } = useApp();
  const [open, setOpen] = useState(false);

  const navItems = [...PUBLIC_NAV, { key: "contact", label: "Contact" }];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <LogoButton />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.key as any)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                view === item.key ? "text-primary" : "text-foreground/70 hover:text-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" onClick={() => navigate("support")} className="text-foreground/80">
            <LifeBuoy className="mr-1.5 h-4 w-4" /> Support
          </Button>
          <Button variant="outline" onClick={() => navigate("login")}>Login</Button>
          <Button onClick={() => navigate("register")}>Get Started</Button>
        </div>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px]">
              <SheetHeader className="text-left">
                <SheetTitle><LogoButton /></SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { navigate(item.key as any); setOpen(false); }}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      view === item.key ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="my-3 h-px bg-border" />
                <Button variant="outline" className="w-full" onClick={() => { navigate("login"); setOpen(false); }}>Login</Button>
                <Button className="w-full" onClick={() => { navigate("register"); setOpen(false); }}>Get Started</Button>
                <Button variant="ghost" className="mt-2 w-full justify-start text-destructive" onClick={() => { navigate("support"); setOpen(false); }}>
                  <Phone className="mr-2 h-4 w-4" /> Need immediate help?
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
