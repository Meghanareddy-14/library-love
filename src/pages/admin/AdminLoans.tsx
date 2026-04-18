import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminLoans = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "overdue" | "returned">("all");

  useEffect(() => { document.title = "Loans · ALMS Admin"; load(); }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("loans")
      .select("id, issued_at, due_at, returned_at, status, books(title), profiles(full_name, email)")
      .order("issued_at", { ascending: false });
    if (error) toast.error(error.message);
    setLoans(data ?? []);
  };

  const markReturned = async (id: string) => {
    const { error } = await supabase.from("loans").update({ status: "returned", returned_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked returned");
    load();
  };

  const now = new Date();
  const filtered = loans.filter((l) => {
    if (filter === "all") return true;
    if (filter === "returned") return l.status === "returned";
    const overdue = l.status === "active" && new Date(l.due_at) < now;
    if (filter === "overdue") return overdue;
    if (filter === "active") return l.status === "active" && !overdue;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Loans</h1>
          <p className="text-muted-foreground mt-1">All issue/return records</p>
        </div>

        <div className="flex gap-1 rounded-md border border-border bg-card p-1 w-fit">
          {(["all", "active", "overdue", "returned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Book</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Borrower</th>
                <th className="text-left px-4 py-2.5 font-medium">Due</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l) => {
                const overdue = l.status === "active" && new Date(l.due_at) < now;
                return (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{l.books?.title}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{l.profiles?.full_name ?? l.profiles?.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(l.due_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs rounded px-1.5 py-0.5 ${
                        l.status === "returned" ? "bg-success/10 text-success" : overdue ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"
                      }`}>
                        {l.status === "returned" ? "Returned" : overdue ? "Overdue" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {l.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => markReturned(l.id)}>Return</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No loans</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminLoans;
