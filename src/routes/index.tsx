import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, Heart, HeartHandshake, Home as HomeIcon, Search, ShieldCheck, Sparkles, Stethoscope, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import hero from "@/assets/hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, URGENCY_COLORS, formatCurrency } from "@/lib/case-helpers";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HopeBridge — Someone needs help today. You can change their tomorrow." },
      { name: "description", content: "Sponsor verified individuals in need. Funds paid directly to schools, hospitals, and trusted institutions." },
    ],
  }),
  component: Home,
});

const CATEGORIES = [
  { key: "education", label: "Education", icon: GraduationCap, desc: "School & college fees" },
  { key: "medical", label: "Medical", icon: Stethoscope, desc: "Treatment & surgery" },
  { key: "senior_care", label: "Senior Care", icon: UserRound, desc: "Elder support" },
  { key: "child_welfare", label: "Child Welfare", icon: Heart, desc: "Nutrition & shelter" },
  { key: "single_mother", label: "Single Mother", icon: HeartHandshake, desc: "Family support" },
  { key: "emergency", label: "Emergency", icon: Sparkles, desc: "Crisis aid" },
] as const;

function Home() {
  const { data: cases } = useQuery({
    queryKey: ["urgent-cases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cases")
        .select("*")
        .in("status", ["verified", "sponsored"])
        .order("priority_score", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay bg-cover bg-center"
          style={{ backgroundImage: `url(${hero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
        <div className="container relative mx-auto px-4 pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="max-w-3xl">
            <Badge className="bg-accent/20 text-accent border border-accent/30 backdrop-blur">
              <ShieldCheck className="h-3 w-3 mr-1" /> Verified · Transparent · Direct
            </Badge>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-[1.05]">
              Someone needs help today.<br />
              <span className="text-accent">You can change their tomorrow.</span>
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/80 max-w-2xl">
              HopeBridge connects verified individuals in need with sponsors. Funds are paid directly
              to schools, hospitals, and trusted institutions — no middlemen.
            </p>
            <div className="mt-8 flex items-center gap-2 max-w-xl rounded-xl bg-card/95 backdrop-blur p-2 shadow-2xl">
              <Search className="ml-2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search by cause, city, or need..." className="border-0 focus-visible:ring-0 shadow-none bg-transparent" />
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/browse">Search</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/browse">Donate Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-card/10 border-primary-foreground/30 text-primary-foreground hover:bg-card/20">
                <Link to="/submit-case">Register a Need</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="container mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            ["12,840", "Beneficiaries"],
            ["4,210", "Sponsors"],
            ["$3.2M", "Funds Raised"],
            ["6,500", "Students Supported"],
            ["1,840", "Medical Cases"],
          ].map(([n, label]) => (
            <div key={label} className="text-center">
              <div className="font-display text-2xl md:text-3xl font-bold text-primary">{n}</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Where help is needed most</h2>
          <p className="mt-3 text-muted-foreground">Choose a cause that matters to you. Every contribution is tracked and verified.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((c) => (
            <Link key={c.key} to="/browse" className="group">
              <Card className="p-5 hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1 transition-all border-2 hover:border-primary/40 h-full">
                <div className="h-11 w-11 rounded-lg bg-primary/10 grid place-items-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-semibold text-sm">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Urgent cases */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Badge variant="outline" className="border-accent/40 text-accent mb-3">Urgent</Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold">Verified cases needing help now</h2>
            </div>
            <Button asChild variant="ghost"><Link to="/browse">View all →</Link></Button>
          </div>
          {cases && cases.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.map((c) => <CaseCard key={c.id} c={c} />)}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Heart className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No verified cases yet. Be the first to register a need or sponsor one.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild><Link to="/submit-case">Register a need</Link></Button>
                <Button asChild variant="outline"><Link to="/auth">Sign up as sponsor</Link></Button>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold">How HopeBridge works</h2>
          <p className="mt-3 text-muted-foreground">Trust built through verification at every step.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Users, title: "Register a need", desc: "Beneficiaries submit cases with ID, documents, and institution details." },
            { icon: ShieldCheck, title: "Verified by team", desc: "Identity, documents, and institution are confirmed before listing." },
            { icon: Home, title: "Pay institution directly", desc: "Sponsors fund directly to schools, hospitals & care homes — full transparency." },
          ].map((s, i) => (
            <Card key={s.title} className="p-7 border-2">
              <div className="h-12 w-12 rounded-xl bg-[var(--gradient-hero)] text-primary-foreground grid place-items-center">
                <s.icon className="h-6 w-6" />
              </div>
              <div className="mt-5 text-xs font-semibold text-accent">STEP {i + 1}</div>
              <h3 className="mt-1 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-[var(--gradient-hero)] p-10 md:p-16 text-center text-primary-foreground shadow-[var(--shadow-elegant)]">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Become a sponsor today</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
            Adopt a student, fund a surgery, support an elder. Direct impact, fully transparent.
          </p>
          <Button asChild size="lg" className="mt-7 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/auth">Start sponsoring</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function CaseCard({ c }: { c: any }) {
  const pct = Math.min(100, (Number(c.amount_raised) / Number(c.amount_needed)) * 100);
  return (
    <Link to="/cases/$id" params={{ id: c.id }}>
      <Card className="overflow-hidden hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1 transition-all border-2 h-full">
        <div className="h-40 bg-[var(--gradient-hero)] relative">
          {c.image_url && <img src={c.image_url} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />}
          <Badge className={`absolute top-3 left-3 ${URGENCY_COLORS[c.urgency]}`}>{c.urgency}</Badge>
          <Badge className="absolute top-3 right-3 bg-card/90 text-foreground">
            <ShieldCheck className="h-3 w-3 mr-1" /> Verified
          </Badge>
        </div>
        <div className="p-5">
          <div className="text-xs font-semibold text-primary uppercase tracking-wide">{CATEGORY_LABELS[c.category]}</div>
          <h3 className="mt-1 font-semibold line-clamp-2">{c.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.story}</p>
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
}
