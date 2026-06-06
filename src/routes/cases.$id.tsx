import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Calendar, MapPin, ShieldCheck, Building2, Heart, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { CATEGORY_LABELS, URGENCY_COLORS, formatCurrency } from "@/lib/case-helpers";

export const Route = createFileRoute("/cases/$id")({
  component: CaseDetail,
});

function CaseDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: c, refetch } = useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      const { data } = await supabase.from("cases").select("*").eq("id", id).single();
      return data;
    },
  });

  if (!c) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  const pct = Math.min(100, (Number(c.amount_raised) / Number(c.amount_needed)) * 100);
  const remaining = Number(c.amount_needed) - Number(c.amount_raised);

  async function sponsor() {
    if (!user) { navigate({ to: "/auth" }); return; }
    const n = Number(amount);
    if (!n || n <= 0) return toast.error("Enter a valid amount.");
    if (n > remaining) return toast.error("Amount exceeds remaining need.");
    setSubmitting(true);
    const { error } = await supabase.from("sponsorships").insert({
      sponsor_id: user.id, case_id: id, amount: n, message: message.slice(0, 500), status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Sponsorship recorded! Payment integration coming soon.");
    setAmount(""); setMessage("");
    refetch();
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/browse"><ArrowLeft className="h-4 w-4 mr-1" />Back to cases</Link></Button>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[16/9] rounded-2xl bg-[var(--gradient-hero)] overflow-hidden relative">
            {c.image_url && <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />}
            <Badge className={`absolute top-4 left-4 ${URGENCY_COLORS[c.urgency]}`}>{c.urgency} urgency</Badge>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary/30">{CATEGORY_LABELS[c.category]}</Badge>
              <Badge className="bg-success/15 text-success border border-success/30"><ShieldCheck className="h-3 w-3 mr-1" />Verified L{c.verification_level}</Badge>
            </div>
            <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold">{c.title}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {c.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{c.city}, {c.country}</span>}
              {c.deadline && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Deadline {new Date(c.deadline).toLocaleDateString()}</span>}
              {c.institution_name && <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{c.institution_name}</span>}
            </div>
          </div>
          <Card className="p-6">
            <h2 className="font-display text-xl font-semibold">The story</h2>
            <p className="mt-3 whitespace-pre-wrap text-foreground/80 leading-relaxed">{c.story}</p>
          </Card>
          {c.institution_name && (
            <Card className="p-6">
              <h2 className="font-display text-xl font-semibold">Direct to institution</h2>
              <p className="mt-2 text-sm text-muted-foreground">Funds for this case are paid directly to <strong>{c.institution_name}</strong> ({c.institution_type}). No money is transferred to the beneficiary.</p>
            </Card>
          )}
        </div>
        <div className="space-y-5">
          <Card className="p-6 sticky top-20 shadow-[var(--shadow-elegant)]">
            <div className="text-3xl font-display font-bold text-primary">{formatCurrency(Number(c.amount_raised))}</div>
            <div className="text-sm text-muted-foreground">raised of {formatCurrency(Number(c.amount_needed))}</div>
            <Progress value={pct} className="h-2 mt-3" />
            <div className="mt-2 text-xs text-muted-foreground">{formatCurrency(remaining)} remaining</div>
            <div className="mt-5 space-y-3">
              <div>
                <Label htmlFor="amt">Sponsorship amount (USD)</Label>
                <Input id="amt" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
              </div>
              <div className="flex gap-2">
                {[50, 100, 250, 500].map((q) => (
                  <Button key={q} type="button" size="sm" variant="outline" className="flex-1" onClick={() => setAmount(String(q))}>${q}</Button>
                ))}
              </div>
              <div>
                <Label htmlFor="msg">Message (optional)</Label>
                <Textarea id="msg" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="A note of encouragement..." />
              </div>
              <Button onClick={sponsor} disabled={submitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Heart className="h-4 w-4 mr-2" />Sponsor this case</>}
              </Button>
              {!user && <p className="text-xs text-center text-muted-foreground">You'll be asked to sign in.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
