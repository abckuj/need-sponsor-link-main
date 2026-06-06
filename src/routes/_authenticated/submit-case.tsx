import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/submit-case")({
  component: SubmitCase,
});

const schema = z.object({
  title: z.string().trim().min(5).max(140),
  category: z.enum(["education","medical","senior_care","child_welfare","single_mother","emergency"]),
  beneficiary_type: z.enum(["student","senior_citizen","single_mother","child","disabled_person","family"]),
  annual_income: z.coerce.number().min(0).optional(),
  family_members: z.coerce.number().int().positive().optional(),
  employment_status: z.enum(["employed","self_employed","unemployed","student","retired","other"]).optional(),
  story: z.string().trim().min(50).max(3000),
  amount_needed: z.coerce.number().positive().max(1_000_000),
  deadline: z.string().optional(),
  urgency: z.enum(["low","medium","high","critical"]),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  institution_name: z.string().trim().max(140).optional(),
  institution_type: z.string().trim().max(80).optional(),
  institution_account_name: z.string().trim().max(140).optional(),
  institution_bank_name: z.string().trim().max(140).optional(),
  institution_account_number: z.string().trim().max(64).optional(),
  institution_ifsc: z.string().trim().max(32).optional(),
  institution_upi: z.string().trim().max(128).optional(),
});

function SubmitCase() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>("education");
  const [beneficiaryType, setBeneficiaryType] = useState<string>("student");
  const [urgencyValue, setUrgencyValue] = useState<string>("medium");
  const [institutionType, setInstitutionType] = useState<string>("school");
  const [employmentStatus, setEmploymentStatus] = useState<string>("unemployed");
  const DOCUMENT_CHECKLIST: Record<string, string[]> = {
    education: ["Fee structure", "Admission letter"],
    medical: ["Doctor report", "Hospital estimate"],
    senior_care: ["Age proof"],
    child_welfare: ["Birth certificate"],
    single_mother: ["Income proof"],
    emergency: ["Police/fire/disaster proof"],
  };
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  // Verification flags for trust score
  const [idUploaded, setIdUploaded] = useState(false);
  const [addressProof, setAddressProof] = useState(false);
  const [institutionVerified, setInstitutionVerified] = useState(false);
  const [medicalSchoolDocs, setMedicalSchoolDocs] = useState(false);

  useEffect(() => {
    const docs = DOCUMENT_CHECKLIST[category] ?? [];
    setCheckedDocs(Object.fromEntries(docs.map((d) => [d, false])));
  }, [category]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    // Merge controlled Select / Checkbox values into form data because Radix Select and custom
    // checkboxes do not produce native form fields for FormData.
    const formValues = {
      ...fd,
      category: category,
      beneficiary_type: beneficiaryType,
      urgency: urgencyValue,
      institution_type: institutionType,
      employment_status: employmentStatus,
    } as Record<string, any>;

    const parsed = schema.safeParse(formValues);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    // Ensure required documents are confirmed for the selected category
    const requiredDocs = DOCUMENT_CHECKLIST[parsed.data.category] ?? [];
    const allDocsChecked = requiredDocs.every((d) => !!checkedDocs[d]);
    if (!allDocsChecked) return toast.error("Please confirm all required documents before submitting.");
    // Compute AI priority score
    let score = 0;
    if (parsed.data.urgency === "critical") score += 40;
    else if (parsed.data.urgency === "high") score += 30;
    else if (parsed.data.urgency === "medium") score += 20;

    if (parsed.data.category === "medical") score += 25;
    if (parsed.data.category === "child_welfare") score += 20;
    if (parsed.data.category === "senior_care") score += 15;

    if (Number(parsed.data.amount_needed) < 5000) score += 10;

    // Consider deadline soon if within 14 days
    if (parsed.data.deadline) {
      const d = new Date(parsed.data.deadline as string);
      const now = new Date();
      const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 14) score += 15;
    }

    score = Math.min(score, 100);

    // Compute trust score from verification flags (0-100)
    let trust = 0;
    if (idUploaded) trust += 20;
    if (addressProof) trust += 20;
    if (institutionVerified) trust += 30;
    if (medicalSchoolDocs) trust += 30;
    trust = Math.min(trust, 100);

    setLoading(true);
    const insertPayload = {
      ...parsed.data,
      beneficiary_id: user.id,
      status: "submitted",
      priority_score: score,
      trust_score: trust,
      // Persist verification flags so admin can see what was uploaded/verified
      id_uploaded: idUploaded,
      address_proof: addressProof,
      institution_verified: institutionVerified,
      medical_school_docs: medicalSchoolDocs,
      deadline: parsed.data.deadline || null,
    } as any;

    const { error } = await supabase.from("cases").insert(insertPayload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Case submitted! It will be reviewed within 48 hours.");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Register a need</h1>
      <p className="text-muted-foreground mt-1">Tell us about the case. All submissions are verified before going live.</p>
      <Card className="mt-6 p-6">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Case title"><Input name="title" required maxLength={140} placeholder="e.g. Help Priya complete her nursing degree" /></Field>
          <Field label="Category">
            <Select name="category" required value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="senior_care">Senior Care</SelectItem>
                <SelectItem value="child_welfare">Child Welfare</SelectItem>
                <SelectItem value="single_mother">Single Mother</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Beneficiary type">
            <Select name="beneficiary_type" required value={beneficiaryType} onValueChange={(v) => setBeneficiaryType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="senior_citizen">Senior citizen</SelectItem>
                <SelectItem value="single_mother">Single mother</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="disabled_person">Disabled person</SelectItem>
                <SelectItem value="family">Family</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="The story (min 50 chars)"><Textarea name="story" required minLength={50} maxLength={3000} rows={6} placeholder="Describe the situation, the need, and how the funds will help." /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount needed (USD)"><Input name="amount_needed" type="number" required min="1" max="1000000" /></Field>
            <Field label="Deadline"><Input name="deadline" type="date" /></Field>
          </div>
          <Field label="Urgency">
            <Select name="urgency" value={urgencyValue} onValueChange={(v) => setUrgencyValue(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City"><Input name="city" maxLength={80} /></Field>
            <Field label="Country"><Input name="country" maxLength={80} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Institution name"><Input name="institution_name" maxLength={140} placeholder="School/Hospital" /></Field>
            <Field label="Institution type">
              <Select name="institution_type" value={institutionType} onValueChange={(v) => setInstitutionType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Institution account name"><Input name="institution_account_name" maxLength={140} placeholder="Account holder name" /></Field>
            <Field label="Institution bank name"><Input name="institution_bank_name" maxLength={140} placeholder="Bank name" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Institution account number"><Input name="institution_account_number" maxLength={64} placeholder="Account number" /></Field>
            <Field label="Institution IFSC"><Input name="institution_ifsc" maxLength={32} placeholder="IFSC code" /></Field>
          </div>
          <Field label="Institution UPI ID"><Input name="institution_upi" maxLength={128} placeholder="UPI ID (e.g. inst@bank)" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Annual Household Income">
              <Input name="annual_income" type="number" min="0" step="1" />
            </Field>
            <Field label="Number of Family Members">
              <Input name="family_members" type="number" min="1" step="1" />
            </Field>
          </div>
          <Field label="Employment status">
            <Select name="employment_status" value={employmentStatus} onValueChange={(v) => setEmploymentStatus(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="self_employed">Self-employed</SelectItem>
                <SelectItem value="unemployed">Unemployed</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          { (DOCUMENT_CHECKLIST[category] ?? []).length > 0 && (
            <Field label="Document checklist">
              <div className="space-y-2">
                {(DOCUMENT_CHECKLIST[category] ?? []).map((doc) => (
                  <label key={doc} className="flex items-center gap-2">
                    <Checkbox checked={!!checkedDocs[doc]} onCheckedChange={(c) => setCheckedDocs((p) => ({ ...p, [doc]: !!c }))} />
                    <span className="text-sm">{doc}</span>
                  </label>
                ))}
              </div>
            </Field>
          ) }
          <Field label="Verification uploads">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Checkbox checked={idUploaded} onCheckedChange={(c) => setIdUploaded(!!c)} />
                <span className="text-sm">ID Uploaded (+20)</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={addressProof} onCheckedChange={(c) => setAddressProof(!!c)} />
                <span className="text-sm">Address Proof (+20)</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={institutionVerified} onCheckedChange={(c) => setInstitutionVerified(!!c)} />
                <span className="text-sm">Institution Verified (+30)</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={medicalSchoolDocs} onCheckedChange={(c) => setMedicalSchoolDocs(!!c)} />
                <span className="text-sm">Medical/School Docs (+30)</span>
              </label>
            </div>
          </Field>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit case for review"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="space-y-1.5"><Label>{label}</Label>{children}</div>);
}
