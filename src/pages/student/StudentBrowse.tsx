import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string | null;
  available_copies: number;
  total_copies: number;
}

const StudentBrowse = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [issuing, setIssuing] = useState<string | null>(null);

  useEffect(() => { document.title = "Browse · ALMS"; load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("books").select("*").order("title");
    setBooks(data ?? []);
  };

  const issue = async (book: Book) => {
    if (!user) return;
    if (book.available_copies <= 0) { toast.error("No copies available"); return; }
    setIssuing(book.id);
    const due = new Date(Date.now() + 14 * 86400000).toISOString();
    const { error } = await supabase.from("loans").insert({
      book_id: book.id,
      user_id: user.id,
      due_at: due,
    });
    setIssuing(null);
    if (error) return toast.error(error.message);
    // Best-effort notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "loan_issued",
      title: `Issued: ${book.title}`,
      message: `Due back by ${new Date(due).toLocaleDateString()}.`,
    });
    toast.success(`Issued · due ${new Date(due).toLocaleDateString()}`);
    load();
  };

  const categories = ["All", ...Array.from(new Set(books.map((b) => b.category))).sort()];
  const q = search.toLowerCase();
  const filtered = books.filter((b) => {
    if (category !== "All" && b.category !== category) return false;
    if (!q) return true;
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Browse books</h1>
          <p className="text-muted-foreground mt-1">{books.length} titles in the catalog</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search title, author, category…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-md border border-border bg-card p-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === c ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <div key={b.id} className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <span className="inline-block w-fit text-xs font-medium text-accent-foreground bg-accent rounded px-2 py-0.5 mb-3">
                {b.category}
              </span>
              <h3 className="font-semibold leading-tight">{b.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.author}</p>
              {b.description && <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{b.description}</p>}
              <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-border">
                <span className={`text-xs font-medium ${b.available_copies > 0 ? "text-success" : "text-muted-foreground"}`}>
                  {b.available_copies > 0 ? `${b.available_copies} available` : "Unavailable"}
                </span>
                <Button size="sm" disabled={b.available_copies <= 0 || issuing === b.id} onClick={() => issue(b)}>
                  <BookOpen className="mr-1 h-3.5 w-3.5" />
                  Issue
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-10">No books match your search.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentBrowse;
