"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { authErrorMessage } from "@/lib/firebase-errors";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailPage() {
  const { user, loading, authVersion, sendVerificationEmail, refreshUser, logout } =
    useAuth();
  const toast = useToast();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  // Re-evaluate verification status whenever the user record is refreshed.
  void authVersion;

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const resend = async () => {
    try {
      setSending(true);
      await sendVerificationEmail();
      setCooldown(60);
      toast.success("Email sent", `Check ${user?.email}.`);
    } catch (error) {
      toast.error("Couldn't send the email", authErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const checkVerification = async () => {
    setChecking(true);
    try {
      const fresh = await refreshUser();
      if (fresh?.emailVerified) {
        toast.success("Email verified", "Welcome aboard.");
        router.push("/dashboard");
        return;
      }
      toast.info("Not verified yet", "Open the link in your inbox, then try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <AuthShell
      icon={<MailCheck className="h-5 w-5" />}
      title={user?.emailVerified ? "You're verified" : "Check your email"}
      subtitle={
        user?.emailVerified
          ? "Your account is fully set up."
          : `We sent a verification link to ${user?.email ?? "your inbox"}.`
      }
      footer={
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs text-subtle transition hover:text-fg"
        >
          Sign out
        </button>
      }
    >
      {user?.emailVerified ? (
        <Button className="w-full" size="lg" onClick={() => router.push("/dashboard")}>
          Go to dashboard
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-center text-sm leading-relaxed text-muted">
            Click the link in the email, then come back and continue. The link expires
            after 24 hours.
          </p>
          <Button
            className="w-full"
            size="lg"
            onClick={checkVerification}
            isLoading={checking}
          >
            <RefreshCw className="h-4 w-4" aria-hidden /> I&apos;ve verified
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={resend}
            isLoading={sending}
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
