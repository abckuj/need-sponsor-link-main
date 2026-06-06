import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About HopeBridge" }, { name: "description", content: "Our mission: connect verified needs with trusted sponsors through transparent, direct giving." }] }),
  component: About,
});

function About() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="font-display text-4xl font-bold">About HopeBridge</h1>
      <p className="mt-4 text-lg text-muted-foreground">We're building a sponsorship platform where every contribution can be traced — from sponsor to school, hospital, or care home — with zero middlemen.</p>
      <div className="mt-10 grid gap-5">
        <Card className="p-6"><h2 className="font-display text-xl font-semibold">Our mission</h2><p className="mt-2 text-muted-foreground">Make giving radically transparent by paying institutions directly and verifying every case.</p></Card>
        <Card className="p-6"><h2 className="font-display text-xl font-semibold">How we verify</h2><p className="mt-2 text-muted-foreground">Identity, documents, and institution confirmation across four verification levels before any case is published.</p></Card>
        <Card className="p-6"><h2 className="font-display text-xl font-semibold">Contact</h2><p className="mt-2 text-muted-foreground">Email us at hello@hopebridge.example for partnerships and press.</p></Card>
      </div>
    </div>
  );
}
