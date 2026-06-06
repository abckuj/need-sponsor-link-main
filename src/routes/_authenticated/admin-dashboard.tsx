import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatCurrency } from "@/lib/case-helpers";

export const Route = createFileRoute("/_authenticated/admin-dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — HopeBridge" }] }),
  component: AdminDashboard,
});

const STATUS_OPTIONS = ["submitted", "under_review", "verified", "sponsored", "completed", "rejected"] as const;

function AdminDashboard() {
  const qc = useQueryClient();

  const { data: cases = [] } = useQuery({
    queryKey: ["admin-cases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, verification_level }: { id: string; status: string; verification_level?: number }) => {
      const patch: any = { status };
      if (verification_level !== undefined) patch.verification_level = verification_level;
      const { error } = await supabase.from("cases").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-cases"] }); toast.success("Case updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const pending = cases.filter((c) => c.status === "submitted" || c.status === "under_review");
  const rest = cases.filter((c) => c.status !== "submitted" && c.status !== "under_review");

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-bold">Admin dashboard</h1>
      </div>
      <p className="text-muted-foreground mb-8">Review and verify submitted cases.</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Card className="p-5"><div className="text-sm text-muted-foreground">Total cases</div><div className="font-display text-3xl font-bold text-primary mt-1">{cases.length}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted-foreground">Pending review</div><div className="font-display text-3xl font-bold text-primary mt-1">{pending.length}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted-foreground">Verified/Active</div><div className="font-display text-3xl font-bold text-primary mt-1">{cases.filter((c) => c.status === "verified" || c.status === "sponsored").length}</div></Card>
      </div>

      <h2 className="font-display text-xl font-semibold mb-4">Pending review ({pending.length})</h2>
      <div className="space-y-3 mb-10">
        {pending.length === 0 && <Card className="p-8 text-center text-muted-foreground">No cases pending review.</Card>}
        {pending.map((c) => <CaseRow key={c.id} c={c} onUpdate={updateStatus.mutate} />)}
      </div>

      <h2 className="font-display text-xl font-semibold mb-4">All other cases ({rest.length})</h2>
      <div className="space-y-3">
        {rest.map((c) => <CaseRow key={c.id} c={c} onUpdate={updateStatus.mutate} />)}
      </div>
    </div>
  );
}

function CaseRow({ c, onUpdate }: { c: any; onUpdate: (args: any) => void }) {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{c.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {CATEGORY_LABELS[c.category]} · {c.city}, {c.country} · {formatCurrency(Number(c.amount_needed))} needed
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Submitted {new Date(c.created_at).toLocaleDateString()} · Verification L{c.verification_level}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline">{c.status.replace("_", " ")}</Badge>
          <Select
            value={c.status}
            onValueChange={(status) =>
              onUpdate({
                id: c.id,
                status,
                verification_level: status === "verified" ? Math.max(c.verification_level, 1) : c.verification_level,
              })
            }
          >
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {c.status === "under_review" && (
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => onUpdate({ id: c.id, status: "verified", verification_level: Math.max(c.verification_level + 1, 1) })}
            >
              Verify +1
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
