import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { CATEGORY_LABELS } from "@/lib/case-helpers";

export const Route = createFileRoute("/_authenticated/submit-case")({
  head: () => ({ meta: [{ title: "Submit a Case — HopeBridge" }] }),
  component: SubmitCase,
});

function SubmitCase() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);

    const title = String(fd.get("title") ?? "").trim();
    const story = String(fd.get("story") ?? "").trim();
    const category = String(fd.get("category") ?? "");
    const urgency = String(fd.get("urgency") ?? "medium");
    const amount_needed = Number(fd.get("amount_needed"));
    const city = String(fd.get("city") ?? "").trim();
    const country = String(fd.get("country") ?? "").trim();
    const institution_name = String(fd.get("institution_name") ?? "").trim();
    const institution_type = String(fd.get("institution_type") ?? "").trim();
    const beneficiary_name = String(fd.get("beneficiary_name") ?? "").trim();
    const deadline = String(fd.get("deadline") ?? "").trim() || null;

    if (!title || !story || !category || !amount_needed || amount_needed <= 0) {
      return toast.error("Fill in all required fields with valid values.");
    }

    setLoading(true);
    const { error } = await supabase.from("cases").insert({
      beneficiary_id: user.id,
      title,
      story,
      category: category as any,
      urgency: urgency as any,
      amount_needed,
      city: city || null,
      country: country || null,
      institution_name: institution_name || null,
      institution_type: institution_type || null,
      beneficiary_name: beneficiary_name || null,
      deadline,
      status: "submitted",
    });
    setLoading(false);

    if (error) return toast.error(error.message);
    toast.success("Case submitted! Our team will review it shortly.");
    navigate({ to: "/beneficiary-dashboard" });
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Submit a need</h1>
      <p className="mt-2 text-muted-foreground">Fill in the details below. Our team reviews every submission before publishing.</p>

      <Card className="mt-8 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title">Case title *</Label>
            <Input id="title" name="title" required maxLength={150} placeholder="e.g. Help Priya complete nursing school" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select name="category" required>
                <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select name="urgency" defaultValue="medium">
                <SelectTrigger id="urgency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="story">Story *</Label>
            <Textarea
              id="story"
              name="story"
              required
              rows={5}
              maxLength={3000}
              placeholder="Describe the situation in detail — who needs help, why, and how the funds will be used."
            />
          </div>

          <div>
            <Label htmlFor="amount_needed">Amount needed (USD) *</Label>
            <Input id="amount_needed" name="amount_needed" type="number" min="1" required placeholder="e.g. 1500" />
          </div>

          <div>
            <Label htmlFor="beneficiary_name">Beneficiary full name</Label>
            <Input id="beneficiary_name" name="beneficiary_name" maxLength={120} placeholder="Full name of the person in need" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" maxLength={80} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" maxLength={80} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="institution_name">Institution name</Label>
              <Input id="institution_name" name="institution_name" maxLength={200} placeholder="School / hospital / care home" />
            </div>
            <div>
              <Label htmlFor="institution_type">Institution type</Label>
              <Input id="institution_type" name="institution_type" maxLength={80} placeholder="e.g. school, hospital" />
            </div>
          </div>

          <div>
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input id="deadline" name="deadline" type="date" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit case for review"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
