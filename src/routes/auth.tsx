import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — HopeBridge" }, { name: "description", content: "Sign in or create your HopeBridge account." }] }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("signin");

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passwordSchema.safeParse(fd.get("password"));
    if (!email.success || !password.success) return toast.error("Enter a valid email and password.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passwordSchema.safeParse(fd.get("password"));
    const fullName = String(fd.get("full_name") ?? "").trim().slice(0, 120);
    const role = String(fd.get("role") ?? "sponsor");
    if (!email.success || !password.success) return toast.error("Enter a valid email and password (min 6 chars).");
    if (!fullName) return toast.error("Please enter your name.");
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.data,
      password: password.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, role },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }
    // If email confirmation is disabled, session is returned immediately
    if (signUpData.session) {
      setLoading(false);
      toast.success("Account created! Welcome to HopeBridge.");
      navigate({ to: "/dashboard" });
      return;
    }
    setLoading(false);
    toast.success("Account created! Please sign in.");
    setTab("signin");
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) { setLoading(false); toast.error("Google sign-in failed: " + error.message); return; }
    // browser will redirect to Google — no further action needed
  }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-md p-8 shadow-[var(--shadow-elegant)]">
        <Link to="/" className="flex items-center justify-center gap-2 mb-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--gradient-hero)] text-primary-foreground">
            <Heart className="h-5 w-5" />
          </span>
        </Link>
        <h1 className="font-display text-2xl font-bold text-center">Welcome to HopeBridge</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">Sponsor or receive verified help.</p>

        <Button variant="outline" className="w-full mt-6" onClick={handleGoogle} disabled={loading}>
          Continue with Google
        </Button>
        <div className="relative my-5"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="signin">Sign in</TabsTrigger><TabsTrigger value="signup">Create account</TabsTrigger></TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 mt-4">
              <div><Label htmlFor="si-email">Email</Label><Input id="si-email" name="email" type="email" required /></div>
              <div><Label htmlFor="si-password">Password</Label><Input id="si-password" name="password" type="password" required /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 mt-4">
              <div><Label htmlFor="su-name">Full name</Label><Input id="su-name" name="full_name" required maxLength={120} /></div>
              <div><Label htmlFor="su-email">Email</Label><Input id="su-email" name="email" type="email" required /></div>
              <div><Label htmlFor="su-password">Password</Label><Input id="su-password" name="password" type="password" required minLength={6} /></div>
              <div>
                <Label>I'm joining as</Label>
                <RadioGroup defaultValue="sponsor" name="role" className="grid grid-cols-2 gap-2 mt-2">
                  <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <RadioGroupItem value="sponsor" /> Sponsor
                  </Label>
                  <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <RadioGroupItem value="beneficiary" /> Beneficiary
                  </Label>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
