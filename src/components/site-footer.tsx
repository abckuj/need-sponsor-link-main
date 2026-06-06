import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40 mt-20">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gradient-hero)] text-primary-foreground">
              <Heart className="h-4 w-4" />
            </span>
            <span className="font-display">HopeBridge</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Connecting verified needs with trusted sponsors. Transparent giving, real impact.
          </p>
        </div>
        <FooterCol title="Platform" links={[
          ["Browse cases", "/browse"],
          ["Impact dashboard", "/impact"],
          ["Success stories", "/stories"],
        ]} />
        <FooterCol title="Company" links={[
          ["About us", "/about"],
          ["Contact", "/about"],
          ["FAQ", "/about"],
        ]} />
        <FooterCol title="Legal" links={[
          ["Privacy policy", "/about"],
          ["Terms of use", "/about"],
        ]} />
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} HopeBridge. Built with care.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={label}><Link to={href} className="hover:text-foreground">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
