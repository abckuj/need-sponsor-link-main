import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatCurrency } from "@/lib/case-helpers";

export const Route = createFileRoute("/impact")({
  head: () => ({ meta: [{ title: "Impact dashboard — HopeBridge" }, { name: "description", content: "Live metrics on cases, funding, and the people we've supported." }] }),
  component: Impact,
});

function Impact() {
  const { data } = useQuery({
    queryKey: ["impact-stats"],
    queryFn: async () => {
      const { data: cases } = await supabase.from("cases").select("category, amount_raised, amount_needed, status");
      return cases ?? [];
    },
  });
  const cases = data ?? [];
  const totalRaised = cases.reduce((s, c) => s + Number(c.amount_raised), 0);
  const verified = cases.filter((c) => c.status === "verified" || c.status === "sponsored" || c.status === "completed").length;
  const byCategory = cases.reduce<Record<string, number>>((acc, c) => { acc[c.category] = (acc[c.category] ?? 0) + Number(c.amount_raised); return acc; }, {});

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Impact dashboard</h1>
      <p className="mt-2 text-muted-foreground">Live transparency on what HopeBridge sponsors have made possible.</p>
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <Card className="p-6"><div className="text-sm text-muted-foreground">Total funds raised</div><div className="font-display text-3xl font-bold text-primary mt-1">{formatCurrency(totalRaised)}</div></Card>
        <Card className="p-6"><div className="text-sm text-muted-foreground">Verified cases</div><div className="font-display text-3xl font-bold text-primary mt-1">{verified}</div></Card>
        <Card className="p-6"><div className="text-sm text-muted-foreground">All cases</div><div className="font-display text-3xl font-bold text-primary mt-1">{cases.length}</div></Card>
      </div>

      <h2 className="font-display text-2xl font-bold mt-12 mb-4">Funding by category</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(byCategory).map(([k, v]) => (
          <Card key={k} className="p-5 flex items-center justify-between">
            <div className="font-semibold">{CATEGORY_LABELS[k] ?? k}</div>
            <div className="font-display text-xl font-bold text-primary">{formatCurrency(v)}</div>
          </Card>
        ))}
        {Object.keys(byCategory).length === 0 && <Card className="p-10 text-center text-muted-foreground md:col-span-2">No funding data yet.</Card>}
      </div>
    </div>
  );
}
