import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatCurrency } from "@/lib/case-helpers";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/beneficiary-dashboard")({
  head: () => ({ meta: [{ title: "Beneficiary Dashboard — HopeBridge" }] }),
  component: BeneficiaryDashboard,
});

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-muted text-muted-foreground",
  under_review: "bg-warning/15 text-warning-foreground",
  verified: "bg-success/15 text-success",
  sponsored: "bg-primary/10 text-primary",
  completed: "bg-success/20 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

function BeneficiaryDashboard() {
  const { user } = useAuth();

  const { data: cases = [] } = useQuery({
    queryKey: ["my-cases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("cases")
        .select("*")
        .eq("beneficiary_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My cases</h1>
          <p className="mt-1 text-muted-foreground">Track the status of your submitted needs.</p>
        </div>
        <Button asChild><Link to="/submit-case"><PlusCircle className="h-4 w-4 mr-2" />Submit a case</Link></Button>
      </div>

      <div className="mt-8 space-y-4">
        {cases.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            No cases submitted yet.
            <div className="mt-4"><Button asChild><Link to="/submit-case">Submit a need</Link></Button></div>
          </Card>
        ) : (
          cases.map((c) => {
            const pct = Math.min(100, (Number(c.amount_raised) / Number(c.amount_needed)) * 100);
            return (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{c.title}</span>
                      <Badge className={`text-xs ${STATUS_COLORS[c.status] ?? ""}`}>{c.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{CATEGORY_LABELS[c.category]} · Submitted {new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                  <Button asChild variant="ghost" size="icon">
                    <Link to="/cases/$id" params={{ id: c.id }}><ExternalLink className="h-4 w-4" /></Link>
                  </Button>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{formatCurrency(Number(c.amount_raised))} raised</span>
                    <span className="text-muted-foreground">of {formatCurrency(Number(c.amount_needed))}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
                {c.verification_level > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Verification level {c.verification_level}/4</p>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
