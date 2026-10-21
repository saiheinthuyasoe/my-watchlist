"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, TriangleAlert, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { authErrorMessage } from "@/lib/firebase-errors";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

function passwordScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(4, score);
}

const STRENGTH = [
  { label: "Too short", color: "bg-rose-500" },
  { label: "Weak", color: "bg-rose-500" },
  { label: "Fair", color: "bg-amber-500" },
  { label: "Good", color: "bg-sky-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

export default function RegisterPage() {
  const { user, loading, registerWithEmail, signInWithGoogle } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => passwordScore(password), [password]);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter a display name (at least 2 characters).");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail(email.trim(), password, name.trim());
      toast.success("Account created", "Check your inbox to verify your email.");
      router.push("/auth/verify-email");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Account ready");
      router.replace("/dashboard");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track anime and donghua for free. No credit card, no ads."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-[var(--accent)] hover:opacity-80"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <GoogleButton
          onClick={handleGoogle}
          isLoading={googleLoading}
          label="Sign up with Google"
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[11px] uppercase tracking-wider text-subtle">
            or with email
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Display name"
            type="text"
            placeholder="How should we call you?"
            value={name}
            onChange={(event) => setName(event.target.value)}
            leftIcon={<User className="h-4 w-4" />}
            autoComplete="nickname"
            maxLength={60}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            autoComplete="email"
            required
          />
          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              autoComplete="new-password"
              required
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="rounded-md p-1.5 text-subtle transition hover:bg-elevated hover:text-fg"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {password && (
              <div className="mt-2">
                <div className="flex gap-1" aria-hidden>
                  {[0, 1, 2, 3].map((index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        index < strength ? STRENGTH[strength].color : "bg-elevated"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-subtle">
                  Strength: {STRENGTH[strength].label}
                </p>
              </div>
            )}
          </div>
          <Input
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            autoComplete="new-password"
            error={confirm && confirm !== password ? "Passwords don't match." : undefined}
            required
          />

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-400"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" isLoading={submitting}>
            Create account
          </Button>

          <p className="text-center text-[11px] leading-relaxed text-subtle">
            By creating an account you agree to keep this a personal watchlist.
            We store only your email, display name and watchlist.
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
