import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import brandMark from "@/assets/marketland-mark.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Register — Marketland Global" },
      {
        name: "description",
        content:
          "Create your Marketland Global account or sign in to place orders and track your spare parts deliveries.",
      },
      { property: "og:title", content: "Sign In or Register — Marketland Global" },
      {
        property: "og:description",
        content: "Access your Marketland Global account to order auto spare parts.",
      },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({ full_name: "", phone: "", email: "", password: "" });

  useEffect(() => {
    if (user) void navigate({ to: "/", replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: login.email.trim(),
      password: login.password,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not sign in", { description: error.message });
      return;
    }
    toast.success("Welcome back!");
    void navigate({ to: "/", replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(signup);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
      },
    });
    setBusy(false);
    if (error) {
      toast.error("Could not create account", { description: error.message });
      return;
    }
    if (!data.session) {
      toast.success("Check your email", {
        description: "Confirm your email address to finish creating your account.",
      });
      return;
    }
    toast.success("Account created. Welcome to Marketland Global!");
    void navigate({ to: "/", replace: true });
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/", replace: true });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl surface-tint">
          <img src={brandMark.url} alt="MarketLand logo" width={36} height={36} className="size-9" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in or create an account to order spare parts and track deliveries.
        </p>
      </div>


      <div className="mt-6 p-5 surface-card">
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={login.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={login.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                />
              </div>
              <Button variant="hero" className="w-full" type="submit" disabled={busy}>
                Sign in
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-5">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="su-name">Full name</Label>
                <Input
                  id="su-name"
                  required
                  maxLength={80}
                  value={signup.full_name}
                  onChange={(e) => setSignup({ ...signup, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="su-phone">Phone number</Label>
                <Input
                  id="su-phone"
                  type="tel"
                  required
                  maxLength={20}
                  placeholder="080..."
                  value={signup.phone}
                  onChange={(e) => setSignup({ ...signup, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="su-email">Email</Label>
                <Input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={signup.email}
                  onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="su-password">Password</Label>
                <Input
                  id="su-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={signup.password}
                  onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                />
              </div>
              <Button variant="hero" className="w-full" type="submit" disabled={busy}>
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
          Continue with Google
        </Button>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Need help? <Link to="/support" className="underline">Contact customer service</Link>
        </p>
      </div>
    </div>
  );
}
