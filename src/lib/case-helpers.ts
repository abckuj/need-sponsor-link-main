export const CATEGORY_LABELS: Record<string, string> = {
  education: "Education",
  medical: "Medical",
  senior_care: "Senior Care",
  child_welfare: "Child Welfare",
  single_mother: "Single Mother",
  emergency: "Emergency",
};

export const URGENCY_COLORS: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/15 text-warning-foreground border-warning/40",
  high: "bg-accent/15 text-accent-foreground border-accent/40",
  critical: "bg-destructive/15 text-destructive border-destructive/40",
};

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
