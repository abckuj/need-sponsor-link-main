import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/case-helpers";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/sponsor-dashboard")({
  head: () => ({ meta: [{ title: "Sponsor Dashboard — HopeBridge" }] }),
  component: SponsorDashboard,
});

function SponsorDashboard() {
  const { user } = useAuth();

  const { data: sponsorships = [] } = useQuery({
    queryKey: ["my-sponsorships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("sponsorships")
        .select("*, cases(id, title, category, status, amount_needed, amount_raised)")
        .eq("sponsor_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const totalGiven = sponsorships.reduce((s, sp) => s + Number(sp.amount), 0);

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Sponsor dashboard</h1>
      <p className="mt-1 text-muted-foreground">Your sponsorship history and impact.</p>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total contributed</div>
          <div className="font-display text-3xl font-bold text-primary mt-1">{formatCurrency(totalGiven)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Cases sponsored</div>
          <div className="font-display text-3xl font-bold text-primary mt-1">{sponsorships.length}</div>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Your sponsorships</h2>
          <Button asChild size="sm"><Link to="/browse">Find more cases</Link></Button>
        </div>
        {sponsorships.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <Heart className="h-8 w-8 mx-auto mb-3" />
            You haven't sponsored any cases yet.
            <div className="mt-4"><Button asChild><Link to="/browse">Browse cases</Link></Button></div>
          </Card>
        ) : (
          <div className="space-y-3">
            {sponsorships.map((sp: any) => (
              <Card key={sp.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{sp.cases?.title ?? "Case"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(sp.created_at).toLocaleDateString()} · {sp.cases?.status}
                  </div>
                  {sp.message && <div className="text-sm text-muted-foreground mt-1 italic">"{sp.message}"</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display font-bold text-primary">{formatCurrency(Number(sp.amount))}</div>
                  <Badge variant="outline" className="text-xs mt-1">{sp.status}</Badge>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link to="/cases/$id" params={{ id: sp.case_id }}><ExternalLink className="h-4 w-4" /></Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
