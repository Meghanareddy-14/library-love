import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Library, Users, ClipboardList, AlertTriangle } from "lucide-react";

interface Stats {
  users: number;
  books: number;
  activeLoans: number;
  overdue: number;
}

const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: boolean }) => (
  <div className="rounded-lg border border-border bg-card p-5 shadow-card">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${accent ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
  </div>
);

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({ users: 0, books: 0, activeLoans: 0, overdue: 0 });
  const [recentLoans, setRecentLoans] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Admin · ALMS";
    const load = async () => {
      const now = new Date().toISOString();
      const [
        { count: users },
        { count: books },
        { count: activeLoans },
        { count: overdue },
        { data: recent },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("status", "active").lt("due_at", now),
        supabase
          .from("loans")
          .select("id, issued_at, due_at, status, books(title), profiles(full_name, email)")
          .order("issued_at", { ascending: false })
          .limit(8),
      ]);
      setStats({
        users: users ?? 0,
        books: books ?? 0,
        activeLoans: activeLoans ?? 0,
        overdue: overdue ?? 0,
      });
      setRecentLoans(recent ?? []);
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Library activity at a glance</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Total users" value={stats.users} />
          <StatCard icon={Library} label="Books in catalog" value={stats.books} />
          <StatCard icon={ClipboardList} label="Active loans" value={stats.activeLoans} />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} accent />
        </div>

        <div className="rounded-lg border border-border bg-card shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Recent loans</h2>
          </div>
          {recentLoans.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No loans yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentLoans.map((l) => {
                const overdue = l.status === "active" && new Date(l.due_at) < new Date();
                return (
                  <div key={l.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{l.books?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.profiles?.full_name ?? l.profiles?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Due {new Date(l.due_at).toLocaleDateString()}</p>
                      <span className={`inline-block mt-1 text-[10px] font-medium rounded px-1.5 py-0.5 ${
                        l.status === "returned"
                          ? "bg-success/10 text-success"
                          : overdue
                          ? "bg-destructive/10 text-destructive"
                          : "bg-accent text-accent-foreground"
                      }`}>
                        {l.status === "returned" ? "Returned" : overdue ? "Overdue" : "Active"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;
