import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, URGENCY_COLORS, formatCurrency } from "@/lib/case-helpers";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Cases — HopeBridge" },
      { name: "description", content: "Find verified cases to sponsor across education, medical, senior care, and more." },
    ],
  }),
  component: Browse,
});

function Browse() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [urgency, setUrgency] = useState("all");

  const { data: cases = [] } = useQuery({
    queryKey: ["browse-cases", category, urgency],
    queryFn: async () => {
      let q = supabase
        .from("cases")
        .select("*")
        .in("status", ["verified", "sponsored"])
        .order("priority_score", { ascending: false });
      if (category !== "all") q = q.eq("category", category as any);
      if (urgency !== "all") q = q.eq("urgency", urgency as any);
      const { data } = await q;
      return data ?? [];
    },
  });

  const filtered = cases.filter(
    (c) =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.story ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Browse verified cases</h1>
      <p className="mt-2 text-muted-foreground">Every case has been identity-verified before listing.</p>

      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, city, or story..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={urgency} onValueChange={setUrgency}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Urgency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All urgency</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="mt-10 p-14 text-center text-muted-foreground">
          No cases match your filters. Cases appear here once verified by the team.
        </Card>
      ) : (
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => {
            const pct = Math.min(100, (Number(c.amount_raised) / Number(c.amount_needed)) * 100);
            return (
              <Link key={c.id} to="/cases/$id" params={{ id: c.id }}>
                <Card className="overflow-hidden hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1 transition-all border-2 h-full">
                  <div className="h-40 bg-[var(--gradient-hero)] relative">
                    {c.image_url && <img src={c.image_url} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />}
                    <Badge className={`absolute top-3 left-3 ${URGENCY_COLORS[c.urgency]}`}>{c.urgency}</Badge>
                    <Badge className="absolute top-3 right-3 bg-card/90 text-foreground">
                      <ShieldCheck className="h-3 w-3 mr-1" />Verified
                    </Badge>
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wide">{CATEGORY_LABELS[c.category]}</div>
                    <h3 className="mt-1 font-semibold line-clamp-2">{c.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.story}</p>
                    {c.city && <p className="mt-1 text-xs text-muted-foreground">{c.city}, {c.country}</p>}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">{formatCurrency(Number(c.amount_raised))} raised</span>
                        <span className="text-muted-foreground">of {formatCurrency(Number(c.amount_needed))}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
