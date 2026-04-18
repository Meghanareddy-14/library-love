import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Library, ClipboardList, AlertTriangle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const StatCard = ({ icon: Icon, label, value, accent }: any) => (
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

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, overdue: 0, totalBooks: 0 });
  const [myLoans, setMyLoans] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => { document.title = "Dashboard · ALMS"; }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const now = new Date().toISOString();
      const [{ count: active }, { count: overdue }, { count: totalBooks }, { data: loans }, { data: notes }] = await Promise.all([
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active").lt("due_at", now),
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase
          .from("loans")
          .select("id, due_at, status, books(title, author)")
          .eq("user_id", user.id)
          .order("issued_at", { ascending: false })
          .limit(5),
        supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({ active: active ?? 0, overdue: overdue ?? 0, totalBooks: totalBooks ?? 0 });
      setMyLoans(loans ?? []);
      setNotifs(notes ?? []);
    };
    load();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Your library at a glance</p>
          </div>
          <Button asChild><Link to="/student/browse"><BookOpen className="mr-1.5 h-4 w-4" /> Browse books</Link></Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={ClipboardList} label="Active loans" value={stats.active} />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} accent />
          <StatCard icon={Library} label="Books available" value={stats.totalBooks} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Recent loans</h2>
              <Link to="/student/loans" className="text-xs text-accent-foreground hover:underline">View all</Link>
            </div>
            {myLoans.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No loans yet — browse the catalog to get started.</p>
            ) : (
              <div className="divide-y divide-border">
                {myLoans.map((l) => {
                  const overdue = l.status === "active" && new Date(l.due_at) < new Date();
                  return (
                    <div key={l.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium">{l.books?.title}</p>
                        <p className="text-xs text-muted-foreground">{l.books?.author}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Due {new Date(l.due_at).toLocaleDateString()}</p>
                        <span className={`inline-block mt-1 text-[10px] font-medium rounded px-1.5 py-0.5 ${
                          l.status === "returned" ? "bg-success/10 text-success" : overdue ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"
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

          <div className="rounded-lg border border-border bg-card shadow-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Notifications</h2>
            </div>
            {notifs.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">All clear — no notifications.</p>
            ) : (
              <div className="divide-y divide-border">
                {notifs.map((n) => (
                  <div key={n.id} className="px-5 py-3">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
