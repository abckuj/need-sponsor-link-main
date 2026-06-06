import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, URGENCY_COLORS, formatCurrency } from "@/lib/case-helpers";

export const Route = createFileRoute("/browse")({
  head: () => ({ meta: [{ title: "Browse verified cases — HopeBridge" }, { name: "description", content: "Explore verified individuals in need and sponsor a cause that matters to you." }] }),
  component: Browse,
});

const CATEGORIES = ["all", "education", "medical", "senior_care", "child_welfare", "single_mother", "emergency"];
const SPECIAL_FILTERS = [
  { key: "none", label: "All sponsors" },
  { key: "children", label: "Children" },
  { key: "students", label: "Students" },
  { key: "single_mothers", label: "Single Mothers" },
  { key: "seniors", label: "Senior Citizens" },
  { key: "medical_emergencies", label: "Medical Emergencies" },
];

function Browse() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [special, setSpecial] = useState("none");
  const { data: cases } = useQuery({
    queryKey: ["browse", cat],
    queryFn: async () => {
      let query = supabase.from("cases").select("*").in("status", ["verified","sponsored","completed"]).order("priority_score", { ascending: false });
      if (cat !== "all") query = query.eq("category", cat as any);
      const { data } = await query;
      return data ?? [];
    },
  });
  const filtered = (cases ?? []).filter((c) => {
    if (q) {
      const matchesQ = c.title.toLowerCase().includes(q.toLowerCase()) || c.story.toLowerCase().includes(q.toLowerCase());
      if (!matchesQ) return false;
    }
    // Special filters
    if (special === "children") return (c.beneficiary_type === "child") || (c.category === "child_welfare");
    if (special === "students") return (c.beneficiary_type === "student") || (c.category === "education");
    if (special === "single_mothers") return c.beneficiary_type === "single_mother";
    if (special === "seniors") return (c.beneficiary_type === "senior_citizen") || (c.category === "senior_care");
    if (special === "medical_emergencies") return c.category === "medical" && (c.urgency === "critical" || c.urgency === "high");
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Browse verified cases</h1>
      <p className="mt-2 text-muted-foreground">Every case here has been verified. Funds go directly to the institution.</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 border rounded-lg px-3 bg-card">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases..." className="border-0 focus-visible:ring-0 shadow-none" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)} className="capitalize">
            {c === "all" ? "All" : CATEGORY_LABELS[c]}
          </Button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SPECIAL_FILTERS.map((f) => (
          <Button key={f.key} size="sm" variant={special === f.key ? "default" : "outline"} onClick={() => setSpecial(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center md:col-span-2 lg:col-span-3 text-muted-foreground">No cases match your filters yet.</Card>
        ) : filtered.map((c) => {
          const pct = Math.min(100, (Number(c.amount_raised) / Number(c.amount_needed)) * 100);
          return (
            <Link key={c.id} to="/cases/$id" params={{ id: c.id }}>
              <Card className="overflow-hidden hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1 transition-all border-2 h-full">
                <div className="h-40 bg-[var(--gradient-hero)] relative">
                  {c.image_url && <img src={c.image_url} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />}
                  <Badge className={`absolute top-3 left-3 ${URGENCY_COLORS[c.urgency]}`}>{c.urgency}</Badge>
                  <Badge className="absolute top-3 right-3 bg-card/90 text-foreground"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>
                </div>
                <div className="p-5">
                  <div className="text-xs font-semibold text-primary uppercase">{CATEGORY_LABELS[c.category]}</div>
                  <h3 className="mt-1 font-semibold line-clamp-2">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.story}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1"><span className="font-semibold">{formatCurrency(Number(c.amount_raised))}</span><span className="text-muted-foreground">of {formatCurrency(Number(c.amount_needed))}</span></div>
                    <Progress value={pct} className="h-2" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
