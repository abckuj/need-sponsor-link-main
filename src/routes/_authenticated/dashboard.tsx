import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Heart, FileCheck, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { CATEGORY_LABELS, formatCurrency } from "@/lib/case-helpers";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, roles } = useAuth();
  const isBeneficiary = roles.includes("beneficiary");

  const { data: myCases } = useQuery<any[]>({
    queryKey: ["my-cases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("cases").select("*").eq("beneficiary_id", user!.id).order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });
  const { data: mySponsorships } = useQuery({
    queryKey: ["my-sponsorships", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<any[]> => {
      const { data } = await supabase.from("sponsorships").select("*, cases(*)").eq("sponsor_id", user!.id).order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const totalSponsored = (mySponsorships ?? []).reduce((s, x: any) => s + Number(x.amount), 0);
  const totalRaised = (myCases ?? []).reduce((s, x) => s + Number(x.amount_raised), 0);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Your dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.email}</p>
        </div>
        <div className="flex gap-2">
          {isBeneficiary && <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/submit-case"><Plus className="h-4 w-4 mr-1" />New case</Link></Button>}
          <Button asChild variant="outline"><Link to="/browse">Browse cases</Link></Button>
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Heart} label="Total sponsored" value={formatCurrency(totalSponsored)} />
        <Stat icon={FileCheck} label="Active sponsorships" value={String((mySponsorships ?? []).length)} />
        <Stat icon={TrendingUp} label="Your cases raised" value={formatCurrency(totalRaised)} />
        <Stat icon={FileCheck} label="Your cases" value={String((myCases ?? []).length)} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold mb-4">Your sponsorships</h2>
        {(mySponsorships ?? []).length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No sponsorships yet. <Link to="/browse" className="text-primary underline">Browse cases →</Link></Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {(mySponsorships ?? []).map((s: any) => (
              <Card key={s.id} className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-primary font-semibold uppercase">{CATEGORY_LABELS[s.cases?.category] ?? "—"}</div>
                    <Link to="/cases/$id" params={{ id: s.case_id }} className="font-semibold hover:underline">{s.cases?.title ?? "Case"}</Link>
                  </div>
                  <Badge>{formatCurrency(Number(s.amount))}</Badge>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold mb-4">Your cases</h2>
        {(myCases ?? []).length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No cases submitted. {isBeneficiary && <Link to="/submit-case" className="text-primary underline">Register a need →</Link>}</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {(myCases ?? []).map((c) => {
              const pct = Math.min(100, (Number(c.amount_raised) / Number(c.amount_needed)) * 100);
              return (
                <Card key={c.id} className="p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <Link to="/cases/$id" params={{ id: c.id }} className="font-semibold hover:underline">{c.title}</Link>
                      <div className="mt-1 text-xs text-muted-foreground">{CATEGORY_LABELS[c.category] ?? "—"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="capitalize" variant="outline">{c.status.replace("_", " ")}</Badge>
                      <Badge>Trust: {String(Number(c.trust_score ?? 0))}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">{formatCurrency(Number(c.amount_raised))} of {formatCurrency(Number(c.amount_needed))}</div>
                  <Progress value={pct} className="h-2 mt-2" />
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-display text-xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}
