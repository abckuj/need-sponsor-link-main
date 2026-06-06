import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/stories")({
  head: () => ({ meta: [{ title: "Success stories — HopeBridge" }, { name: "description", content: "Real outcomes from sponsored cases — students graduating, surgeries completed, families recovered." }] }),
  component: Stories,
});

const STORIES = [
  { title: "Priya graduated nursing school", category: "Education", body: "Sponsors covered three semesters of fees paid directly to the college. Priya now works at a regional hospital." },
  { title: "Successful heart surgery for Arjun", category: "Medical", body: "The full hospital estimate was funded by twelve sponsors, paid to the hospital account in 48 hours." },
  { title: "Mrs. Iyer back home with care", category: "Senior Care", body: "Monthly support from sponsors funds in-home care visits paid to a verified care provider." },
  { title: "Family rebuilt after floods", category: "Emergency", body: "Emergency assistance funded a month of rent and essential supplies, distributed via a verified NGO partner." },
];

function Stories() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Success stories</h1>
      <p className="mt-2 text-muted-foreground">Outcomes from real cases sponsored on HopeBridge.</p>
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        {STORIES.map((s) => (
          <Card key={s.title} className="p-6 hover:shadow-[var(--shadow-elegant)] transition-shadow border-2">
            <Badge variant="outline" className="text-primary border-primary/30">{s.category}</Badge>
            <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-muted-foreground">{s.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
