import { Link } from "@tanstack/react-router";
import { Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--gradient-hero)] text-primary-foreground">
            <Heart className="h-5 w-5" />
          </span>
          <span className="font-display tracking-tight">HopeBridge</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link to="/browse" className="text-foreground/80 hover:text-foreground" activeProps={{ className: "text-foreground" }}>Browse Cases</Link>
          <Link to="/impact" className="text-foreground/80 hover:text-foreground">Impact</Link>
          <Link to="/stories" className="text-foreground/80 hover:text-foreground">Stories</Link>
          <Link to="/about" className="text-foreground/80 hover:text-foreground">About</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard">Dashboard</Link></Button>
              <Button size="sm" variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
              <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth" search={{ mode: "signup" } as never}>Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
