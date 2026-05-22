import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Chrome } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · WhimsyCraft" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { loading, isAdmin } = useAdminAuth();
  if (loading) return <div className="text-center py-32 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <AdminLogin />;
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold">🌸 Secret Garden</h1>
        <div className="flex gap-2 text-sm">
          <Link to="/admin" className="px-3 py-1.5 rounded-full bg-muted [&.active]:bg-primary [&.active]:text-primary-foreground" activeOptions={{ exact: true }}>Dashboard</Link>
          <Link to="/admin/orders" className="px-3 py-1.5 rounded-full bg-muted [&.active]:bg-primary [&.active]:text-primary-foreground">Orders</Link>
          <Link to="/admin/inventory" className="px-3 py-1.5 rounded-full bg-muted [&.active]:bg-primary [&.active]:text-primary-foreground">Inventory</Link>
          <button onClick={() => supabase.auth.signOut()} className="px-3 py-1.5 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground">Sign out</button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit() {
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Signed up! Now ask an existing admin to grant you the admin role.");
        if (data.user) toast.info(`Your user ID: ${data.user.id}`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        nav({ to: "/admin" });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <div className="whimsy-card p-6">
        <h1 className="text-2xl font-display font-bold">Admin {mode === "signup" ? "Sign Up" : "Sign In"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Access to the Secret Garden 🌿</p>
        <div className="space-y-3 mt-4">
          <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" /></div>
          <Button onClick={submit} disabled={busy} className="btn-gold w-full">{busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}</Button>
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-xs text-muted-foreground w-full text-center underline">
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed border-t border-border pt-3">
          <strong>First-time setup:</strong> Sign up, then in the database run:
          <br /><code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">INSERT INTO user_roles (user_id, role) VALUES ('your-user-id', 'admin');</code>
        </p>
      </div>
    </div>
  );
}
