import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleList = (roles ?? []).map((r: any) => r.role);
    if (roleList.includes("admin")) throw redirect({ to: "/admin-dashboard" });
    if (roleList.includes("beneficiary")) throw redirect({ to: "/beneficiary-dashboard" });
    throw redirect({ to: "/sponsor-dashboard" });
  },
  component: () => null,
});
