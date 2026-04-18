import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Users, BarChart3, ArrowRight } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  available_copies: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [featured, setFeatured] = useState<Book[]>([]);

  useEffect(() => {
    document.title = "ALMS — Automated Library Management System";
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("books")
      .select("id, title, author, category, available_copies")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setFeatured(data ?? []));
  }, [user]);

  const goDashboard = () => {
    if (!user) navigate("/auth");
    else navigate(role === "admin" ? "/admin" : "/student");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">ALMS</span>
          </Link>
          <div className="flex items-center gap-2">
            {!loading && user ? (
              <Button onClick={goDashboard}>
                Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>Sign in</Button>
                <Button onClick={() => navigate("/auth")}>Get started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero">
        <div className="container py-20 md:py-28 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Automated Library Management
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
            The complete digital library for modern institutions
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Catalog books, automate issue & return, and give students instant access — all in one elegant dashboard.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" onClick={goDashboard}>
              {user ? "Open dashboard" : "Get started free"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            {!user && (
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Search, title: "Real-time search", desc: "Find any book instantly across the catalog with smart filters." },
            { icon: Users, title: "Role-based access", desc: "Separate, secure dashboards for administrators and students." },
            { icon: BarChart3, title: "Issue & return tracking", desc: "Automated due dates, availability counts, and overdue alerts." },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-card p-6 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured books (only when logged in to satisfy RLS) */}
      {user && featured.length > 0 && (
        <section className="container pb-20">
          <h2 className="text-2xl font-bold mb-6">Recently added</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((b) => (
              <div key={b.id} className="rounded-lg border border-border bg-card p-5 shadow-card">
                <span className="inline-block text-xs font-medium text-accent-foreground bg-accent rounded-md px-2 py-0.5 mb-3">
                  {b.category}
                </span>
                <h3 className="font-semibold leading-tight">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.author}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {b.available_copies} {b.available_copies === 1 ? "copy" : "copies"} available
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ALMS — Automated Library Management System
        </div>
      </footer>
    </div>
  );
};

export default Index;
