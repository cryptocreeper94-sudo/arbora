import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TreePine, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Loader2 } from "lucide-react";
import { trackAuthEvent } from "@/lib/error-tracker";
import { useRef, useCallback } from "react";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least 1 capital letter")
    .regex(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/, "Must contain at least 1 special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage({ onBack }: { onBack?: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "ecosystem">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ecosystemLoading, setEcosystemLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { login, register: registerUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const interactionLog = useRef<string[]>([]);

  const trackInput = useCallback((field: string, event: string) => {
    const entry = `${Date.now()}:${event}:${field}`;
    interactionLog.current.push(entry);
    if (interactionLog.current.length > 50) interactionLog.current.shift();
  }, []);

  const inputTrackingProps = useCallback((fieldName: string, fieldOnBlur?: () => void) => ({
    onFocus: () => trackInput(fieldName, "focus"),
    onBlur: () => { trackInput(fieldName, "blur"); fieldOnBlur?.(); },
    onTouchStart: () => trackInput(fieldName, "touch"),
  }), [trackInput]);

  useEffect(() => {
    trackAuthEvent('auth_page_viewed', { mode });
  }, [mode]);

  useEffect(() => {
    return () => {
      if (interactionLog.current.length > 0) {
        trackAuthEvent("auth_interaction_log", {
          mode,
          interactions: interactionLog.current.slice(-30),
        });
      }
    };
  }, [mode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("sso_token");
    const ssoError = params.get("sso_error");

    if (ssoError) {
      const messages: Record<string, string> = {
        missing_token: "SSO token was not provided. Please try again from the other app.",
        invalid_token: "SSO token is invalid or expired. Please try logging in again.",
        failed: "SSO login failed. Please try logging in with your email and password.",
      };
      toast({
        title: "Ecosystem Login Failed",
        description: messages[ssoError] || "SSO login failed. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/auth");
      return;
    }

    if (ssoToken) {
      setSsoLoading(true);
      const email = params.get("email") || undefined;
      const firstName = params.get("firstName") || undefined;
      const lastName = params.get("lastName") || undefined;

      fetch("/api/auth/sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: ssoToken, email, firstName, lastName }),
      })
        .then(async (res) => {
          if (res.ok) {
            window.history.replaceState({}, "", "/");
            window.location.href = "/";
          } else {
            const data = await res.json().catch(() => ({}));
            toast({
              title: "Ecosystem Login Failed",
              description: data.message || "Could not verify your ecosystem credentials.",
              variant: "destructive",
            });
            window.history.replaceState({}, "", "/auth");
          }
        })
        .catch(() => {
          toast({
            title: "Connection Error",
            description: "Could not connect to the server. Please try again.",
            variant: "destructive",
          });
          window.history.replaceState({}, "", "/auth");
        })
        .finally(() => setSsoLoading(false));
    }
  }, [toast]);

  async function onLogin(values: LoginValues) {
    trackAuthEvent("login_attempt", {
      email: values.email,
      interactions: interactionLog.current.slice(-20),
    });
    login.mutate({ ...values, rememberMe }, {
      onSuccess: () => {
        trackAuthEvent('login_success', { email: values.email });
        navigate("/");
      },
      onError: (error: Error) => {
        trackAuthEvent('login_failed', { email: values.email, error: error.message });
        const msg = error.message.includes("401")
          ? "Invalid email or password"
          : "Login failed. Please try again.";
        toast({ title: "Login Failed", description: msg, variant: "destructive" });
      },
    });
  }

  async function onRegister(values: RegisterValues) {
    trackAuthEvent("register_attempt", {
      email: values.email,
      interactions: interactionLog.current.slice(-20),
    });
    registerUser.mutate(
      { firstName: values.firstName, lastName: values.lastName, email: values.email, password: values.password },
      {
        onSuccess: () => {
          trackAuthEvent('register_success', { email: values.email });
          toast({
            title: "Account Created",
            description: "Check your email for a verification link.",
          });
          navigate("/");
        },
        onError: (error: Error) => {
          trackAuthEvent('register_failed', { email: values.email, error: error.message });
          const msg = error.message.includes("409")
            ? "An account with this email already exists"
            : "Registration failed. Please try again.";
          toast({ title: "Registration Failed", description: msg, variant: "destructive" });
        },
      }
    );
  }

  async function onEcosystemLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const identifier = (formData.get("identifier") as string)?.trim();
    const credential = (formData.get("credential") as string)?.trim();

    if (!identifier || !credential) {
      toast({ title: "Missing Fields", description: "Please enter your Trust Layer ID or email and your credential.", variant: "destructive" });
      return;
    }

    setEcosystemLoading(true);
    trackAuthEvent("ecosystem_login_attempt", { identifier: identifier.includes("@") ? identifier : "tlid" });

    try {
      const res = await fetch("/api/auth/ecosystem-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, credential }),
      });

      const data = await res.json();

      if (res.ok) {
        trackAuthEvent("ecosystem_login_success", { identifier: identifier.includes("@") ? identifier : "tlid" });
        toast({ title: "Welcome back!", description: "Signed in via Trust Layer ecosystem." });
        window.location.href = "/";
      } else {
        trackAuthEvent("ecosystem_login_failed", { error: data.message });
        toast({ title: "Sign In Failed", description: data.message || "Could not verify your ecosystem credentials.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Connection Error", description: "Could not connect to the server. Please try again.", variant: "destructive" });
    } finally {
      setEcosystemLoading(false);
    }
  }

  if (ssoLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center">
          <TreePine className="w-10 h-10 text-white" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-lg font-medium text-foreground">Signing you in via Trust Layer...</p>
        <p className="text-sm text-muted-foreground">Connecting your ecosystem account to Verdara</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="flex flex-col lg:flex-row min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 flex-col justify-between p-12">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/30 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <TreePine className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Verdara</span>
            </div>

            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Your Complete
              <br />
              <span className="text-emerald-400">Outdoor Adventure</span>
              <br />
              Platform
            </h1>
            <p className="text-lg text-white/70 max-w-md leading-relaxed">
              Discover trails, identify species, plan trips,
              and explore a trusted marketplace — all in one place.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-4 mt-auto">
            <div className="flex items-center gap-3 text-white/60">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">TrustShield verified marketplace</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <TreePine className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">184 features across 24 activity categories</span>
            </div>
          </div>
        </div>

        <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-start lg:justify-center px-6 py-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center lg:hidden">
                  <TreePine className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-foreground tracking-tight lg:hidden">Verdara</span>
              </div>
              {onBack && (
                <Button
                  variant="ghost"
                  className="text-muted-foreground gap-2 text-sm"
                  onClick={onBack}
                  data-testid="button-back-to-landing"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              )}
            </div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-auth-title">
                {mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : "Trust Layer Sign In"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {mode === "login"
                  ? "Sign in to continue your adventure"
                  : mode === "register"
                  ? "Join the Verdara ecosystem"
                  : "Use your ecosystem credentials to access Verdara"}
              </p>
            </div>

            {mode === "login" ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="login-email-input">Email</label>
                    <input
                      id="login-email-input"
                      name="email"
                      type="text"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                      defaultValue={loginForm.getValues("email")}
                      onChange={(e) => loginForm.setValue("email", e.target.value, { shouldValidate: true })}
                      data-testid="input-login-email"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm font-medium text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              {...inputTrackingProps("login-password", field.onBlur)}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="pr-10"
                              data-testid="input-login-password"
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <label className="flex items-center gap-2 cursor-pointer select-none" data-testid="label-remember-me">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-input accent-emerald-500"
                      data-testid="checkbox-remember-me"
                    />
                    <span className="text-sm text-muted-foreground">Keep me signed in for 30 days</span>
                  </label>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 text-white"
                    disabled={login.isPending}
                    data-testid="button-login-submit"
                  >
                    {login.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    Sign In
                  </Button>
                </form>
              </Form>
            ) : mode === "register" ? (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              {...inputTrackingProps("register-firstname", field.onBlur)}
                              placeholder="First"
                              data-testid="input-register-firstname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              {...inputTrackingProps("register-lastname", field.onBlur)}
                              placeholder="Last"
                              data-testid="input-register-lastname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="register-email-input">Email</label>
                    <input
                      id="register-email-input"
                      name="email"
                      type="text"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                      defaultValue={registerForm.getValues("email")}
                      onChange={(e) => registerForm.setValue("email", e.target.value, { shouldValidate: true })}
                      data-testid="input-register-email"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm font-medium text-destructive">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              {...inputTrackingProps("register-password", field.onBlur)}
                              type={showPassword ? "text" : "password"}
                              placeholder="8+ chars, 1 capital, 1 special"
                              className="pr-10"
                              data-testid="input-register-password"
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              {...inputTrackingProps("register-confirm", field.onBlur)}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="pr-10"
                              data-testid="input-register-confirm-password"
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                    Password requirements: 8 characters minimum, 1 capital letter, 1 special character.
                    This standard applies across the entire Trust Layer ecosystem.
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 text-white"
                    disabled={registerUser.isPending}
                    data-testid="button-register-submit"
                  >
                    {registerUser.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    Create Account
                  </Button>
                </form>
              </Form>
            ) : mode === "ecosystem" ? (
              <form onSubmit={onEcosystemLogin} className="space-y-4">
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 mb-4">
                  <p className="text-xs text-muted-foreground">
                    Sign in with your Trust Layer ID or the email from any DarkWave ecosystem app (Happy Eats, TrustHome, Signal, etc.)
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="eco-identifier">
                    Trust Layer ID or Email
                  </label>
                  <Input
                    id="eco-identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="off"
                    autoCorrect="off"
                    placeholder="tl-xxxx-xxxx or you@example.com"
                    required
                    data-testid="input-ecosystem-identifier"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="eco-credential">
                    Password or Ecosystem PIN
                  </label>
                  <div className="relative">
                    <Input
                      id="eco-credential"
                      name="credential"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Password or PIN"
                      className="pr-10"
                      required
                      data-testid="input-ecosystem-credential"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      data-testid="button-toggle-ecosystem-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    Use your full password or your ecosystem PIN if you've been whitelisted
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 text-white"
                  disabled={ecosystemLoading}
                  data-testid="button-ecosystem-submit"
                >
                  {ecosystemLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Sign In with Trust Layer
                </Button>
              </form>
            ) : null}

            {mode !== "ecosystem" && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "login" ? "register" : "login");
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    className="text-emerald-500 font-medium"
                    data-testid="button-toggle-auth-mode"
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            )}

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">or</span>
              </div>
            </div>

            {mode !== "ecosystem" ? (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
                onClick={() => {
                  setMode("ecosystem");
                  setShowPassword(false);
                }}
                data-testid="button-switch-ecosystem"
              >
                <Shield className="w-4 h-4 mr-2 text-emerald-400" />
                Sign in with Trust Layer
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={() => {
                  setMode("login");
                  setShowPassword(false);
                }}
                data-testid="button-switch-email"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sign in with email instead
              </Button>
            )}

            {mode === "ecosystem" && (
              <p className="text-[10px] text-center text-muted-foreground/60 mt-3">
                Supported: Happy Eats, TrustHome, Signal, TrustVault, and all Trust Layer ecosystem apps
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-muted-foreground">
            DarkWave Studios - Verdara Outdoor Recreation Platform
          </p>
          <a
            href="/admin"
            className="text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
            data-testid="link-dev-dashboard"
          >
            Developer Dashboard
          </a>
        </div>
      </footer>
    </div>
  );
}
