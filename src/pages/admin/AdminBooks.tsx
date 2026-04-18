import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string | null;
  description: string | null;
  total_copies: number;
  available_copies: number;
}

const bookSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  isbn: z.string().trim().max(20).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  total_copies: z.number().int().min(0).max(9999),
});

const empty = { title: "", author: "", category: "", isbn: "", description: "", total_copies: 1 };

const AdminBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = "Books · ALMS Admin"; load(); }, []);

  const load = async () => {
    const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setBooks(data ?? []);
  };

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (b: Book) => {
    setEditing(b);
    setForm({
      title: b.title, author: b.author, category: b.category,
      isbn: b.isbn ?? "", description: b.description ?? "", total_copies: b.total_copies,
    });
    setOpen(true);
  };

  const save = async () => {
    const parsed = bookSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setSaving(true);
    const payload = {
      title: parsed.data.title,
      author: parsed.data.author,
      category: parsed.data.category,
      isbn: parsed.data.isbn || null,
      description: parsed.data.description || null,
      total_copies: parsed.data.total_copies,
    };
    if (editing) {
      // Adjust available to keep delta when total changes
      const delta = parsed.data.total_copies - editing.total_copies;
      const newAvail = Math.max(0, editing.available_copies + delta);
      const { error } = await supabase.from("books").update({ ...payload, available_copies: newAvail }).eq("id", editing.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Book updated");
    } else {
      const { error } = await supabase.from("books").insert({ ...payload, available_copies: parsed.data.total_copies });
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Book added");
    }
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    return !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Books</h1>
            <p className="text-muted-foreground mt-1">{books.length} in catalog</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> Add book</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit book" : "Add book"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Total copies</Label><Input type="number" min={0} value={form.total_copies} onChange={(e) => setForm({ ...form, total_copies: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="space-y-1.5"><Label>ISBN (optional)</Label><Input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>{editing ? "Save" : "Add"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title, author, category…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Title</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Author</th>
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-2.5 font-medium">Avail.</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{b.title}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{b.author}</td>
                  <td className="px-4 py-3 hidden sm:table-cell"><span className="text-xs bg-accent text-accent-foreground rounded px-1.5 py-0.5">{b.category}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{b.available_copies}/{b.total_copies}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No books found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminBooks;
