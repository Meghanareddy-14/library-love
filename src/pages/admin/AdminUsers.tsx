import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Shield, ShieldOff } from "lucide-react";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  roles: string[];
}

const AdminUsers = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => { document.title = "Users · ALMS Admin"; load(); }, []);

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, is_active").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const map = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    });
    setUsers((profiles ?? []).map((p: any) => ({ ...p, roles: map.get(p.id) ?? [] })));
  };

  const toggleAdmin = async (u: UserRow) => {
    const isAdmin = u.roles.includes("admin");
    if (isAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin removed");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Promoted to admin");
    }
    load();
  };

  const toggleActive = async (u: UserRow) => {
    const { error } = await supabase.from("profiles").update({ is_active: !u.is_active }).eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(u.is_active ? "Deactivated" : "Activated");
    load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage roles and access</p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Roles</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.full_name ?? "—"} {u.id === me?.id && <span className="text-xs text-muted-foreground">(you)</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.roles.map((r) => (
                      <span key={r} className={`mr-1 text-xs rounded px-1.5 py-0.5 ${r === "admin" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                        {r}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded px-1.5 py-0.5 ${u.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="outline" size="sm" onClick={() => toggleAdmin(u)}>
                      {u.roles.includes("admin") ? <><ShieldOff className="mr-1 h-3.5 w-3.5" />Demote</> : <><Shield className="mr-1 h-3.5 w-3.5" />Make admin</>}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(u)}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No users</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
