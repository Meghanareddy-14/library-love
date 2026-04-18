import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const StudentLoans = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);

  useEffect(() => { document.title = "My Loans · ALMS"; }, []);
  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    const { data } = await supabase
      .from("loans")
      .select("id, issued_at, due_at, returned_at, status, books(title, author)")
      .eq("user_id", user!.id)
      .order("issued_at", { ascending: false });
    setLoans(data ?? []);
  };

  const ret = async (id: string) => {
    const { error } = await supabase.from("loans").update({ status: "returned", returned_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Returned");
    load();
  };

  const now = new Date();
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My loans</h1>
          <p className="text-muted-foreground mt-1">Issue history and current loans</p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Book</th>
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Issued</th>
                <th className="text-left px-4 py-2.5 font-medium">Due</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loans.map((l) => {
                const overdue = l.status === "active" && new Date(l.due_at) < now;
                return (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{l.books?.title}</p>
                      <p className="text-xs text-muted-foreground">{l.books?.author}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{new Date(l.issued_at).toLocaleDateString()}</td>
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
                        <Button size="sm" variant="outline" onClick={() => ret(l.id)}>Return</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {loans.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No loans yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentLoans;
