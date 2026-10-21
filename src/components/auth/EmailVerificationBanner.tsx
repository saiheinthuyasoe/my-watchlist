"use client";

import { useState } from "react";
import { MailWarning, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { authErrorMessage } from "@/lib/firebase-errors";

export function EmailVerificationBanner() {
  const { user, authVersion, sendVerificationEmail, refreshUser } = useAuth();
  const toast = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // `authVersion` is read so the banner re-evaluates after refreshUser().
  void authVersion;

  const isPasswordAccount = user?.providerData.some(
    (provider) => provider.providerId === "password"
  );

  if (!user || dismissed || user.emailVerified || !isPasswordAccount) return null;

  const resend = async () => {
    try {
      setSending(true);
      await sendVerificationEmail();
      toast.success("Verification email sent", `Check ${user.email}.`);
    } catch (error) {
      toast.error("Couldn't send the email", authErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const checkAgain = async () => {
    const fresh = await refreshUser();
    if (fresh?.emailVerified) {
      toast.success("Email verified", "Your account is fully set up.");
    } else {
      toast.info("Not verified yet", "Open the link in your inbox, then try again.");
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-3">
        <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <p className="text-sm text-fg">
          <span className="font-medium">Verify your email.</span>{" "}
          <span className="text-muted">
            We sent a link to {user.email}. Verifying keeps your account recoverable.
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">
        <Button size="xs" variant="secondary" onClick={resend} isLoading={sending}>
          Resend
        </Button>
        <Button size="xs" variant="ghost" onClick={checkAgain}>
          I&apos;ve verified
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-muted transition hover:bg-elevated hover:text-fg"
          aria-label="Dismiss verification reminder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
