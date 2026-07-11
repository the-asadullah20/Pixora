"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Github, Mail, Lock, Eye, EyeOff, MailCheck, ArrowRight, KeyRound } from "lucide-react";
import { RabbitMascot } from "@/components/mascot/RabbitMascot";
import { Button } from "@/components/ui/Button";
import { SocialButton } from "./SocialButton";
import { GoogleIcon } from "./GoogleIcon";
import {
  AuthActionError,
  logout,
  resendVerificationEmail,
  resetPassword,
  signInWithEmail,
  signInWithGithub,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth-actions";
import { getLastProvider, type AuthProviderId } from "@/lib/firebase";

type Mode = "login" | "signup";

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<AuthProviderId | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [lastProvider, setLastProvider] = useState<AuthProviderId | null>(null);
  const [resent, setResent] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Read localStorage only after mount, to avoid SSR/client hydration mismatch.
  useEffect(() => {
    setLastProvider(getLastProvider());
  }, []);

  const goToApp = () => router.replace("/intro");

  const handleGoogle = async () => {
    setError(null);
    setLoadingAction("google");
    try {
      await signInWithGoogle();
      goToApp();
    } catch (e) {
      setError(e instanceof AuthActionError ? e.message : "Google sign-in failed.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGithub = async () => {
    setError(null);
    setLoadingAction("github");
    try {
      await signInWithGithub();
      goToApp();
    } catch (e) {
      setError(e instanceof AuthActionError ? e.message : "GitHub sign-in failed.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingAction("password");
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        setAwaitingVerification(true);
      } else {
        const cred = await signInWithEmail(email, password);
        if (!cred.user.emailVerified) {
          // Password accounts must confirm their email before they can use
          // Pixora. Stay signed in (so "resend" still works) but don't route
          // into the app — ProtectedRoute also enforces this if they try to
          // navigate there directly.
          setResent(false);
          setResendError(null);
          setAwaitingVerification(true);
          return;
        }
        goToApp();
      }
    } catch (err) {
      setError(err instanceof AuthActionError ? err.message : "Something went wrong.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResend = async () => {
    setResendError(null);
    setResending(true);
    try {
      await resendVerificationEmail();
      setResent(true);
    } catch (err) {
      setResendError(err instanceof AuthActionError ? err.message : "Couldn't send the email. Try again.");
    } finally {
      setResending(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      setResetError(err instanceof AuthActionError ? err.message : "Something went wrong.");
    } finally {
      setResetLoading(false);
    }
  };

  if (forgotPassword) {
    return (
      <AuthShell>
        {resetSent ? (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
              <MailCheck className="h-7 w-7 text-sky-600" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold text-ink-900">
              Check your inbox
            </h2>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              If an account exists for <span className="font-medium text-ink-700">{resetEmail}</span>,
              we&apos;ve sent a link to reset your password.
            </p>
            <p className="mt-3 w-full max-w-sm rounded-2xl bg-sky-50/50 px-4 py-3 text-center text-xs text-ink-600 border border-sky-100/30">
              If the email doesn&apos;t appear within a few minutes, please check your <strong>Spam</strong> or <strong>Junk</strong> folder.
            </p>
            <button
              className="mt-6 text-sm font-medium text-sky-600 hover:underline"
              onClick={() => {
                setForgotPassword(false);
                setResetSent(false);
                setResetEmail("");
              }}
            >
              Back to log in
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                <KeyRound className="h-7 w-7 text-sky-600" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-ink-900">
                Reset your password
              </h2>
              <p className="mt-2 max-w-sm text-sm text-ink-500">
                Enter the email on your account and we&apos;ll send you a reset link.
              </p>
            </div>

            {resetError && (
              <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-center text-sm text-rose-600">
                {resetError}
              </p>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="mt-6 flex flex-col gap-3.5">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500/60" />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-500/50 focus:border-sky-300"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" loading={resetLoading}>
                Send reset link
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <button
              className="mt-4 block w-full text-center text-sm font-medium text-sky-600 hover:underline"
              onClick={() => {
                setForgotPassword(false);
                setResetError(null);
              }}
            >
              Back to log in
            </button>
          </>
        )}
      </AuthShell>
    );
  }

  if (awaitingVerification) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
            <MailCheck className="h-7 w-7 text-sky-600" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold text-ink-900">
            Check your inbox
          </h2>
          <p className="mt-2 max-w-sm text-sm text-ink-500">
            We sent a verification link to <span className="font-medium text-ink-700">{email}</span>.
            Verify your email, then log in to continue — verification is required before you can
            use Pixora.
          </p>
          <p className="mt-3 w-full max-w-sm rounded-2xl bg-sky-50/50 px-4 py-3 text-center text-xs text-ink-600 border border-sky-100/30">
            If the email doesn&apos;t appear within a few minutes, please check your <strong>Spam</strong> or <strong>Junk</strong> folder.
          </p>
          {resendError && (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 text-center text-sm text-rose-600">
              {resendError}
            </p>
          )}
          <Button
            className="mt-6 w-full"
            onClick={handleResend}
            variant="secondary"
            loading={resending}
          >
            {resent ? "Verification email sent" : "Resend verification email"}
          </Button>
          <button
            className="mt-4 text-sm font-medium text-sky-600 hover:underline"
            onClick={async () => {
              await logout();
              setAwaitingVerification(false);
              setResendError(null);
              setResent(false);
              setMode("login");
            }}
          >
            Back to log in
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h2 className="text-center font-display text-2xl font-semibold text-ink-900">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h2>
      <p className="mt-1.5 text-center text-sm text-ink-500">
        {mode === "login"
          ? "Log in to keep searching with Pixora."
          : "Join Pixora and start searching by image."}
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-center text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <SocialButton
          icon={<GoogleIcon className="h-4.5 w-4.5" />}
          label="Google"
          onClick={handleGoogle}
          loading={loadingAction === "google"}
          lastUsed={lastProvider === "google"}
        />
        <SocialButton
          icon={<Github className="h-4.5 w-4.5" />}
          label="GitHub"
          onClick={handleGithub}
          loading={loadingAction === "github"}
          lastUsed={lastProvider === "github"}
        />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-sky-100" />
        <span className="text-xs font-medium uppercase tracking-wider text-ink-500/70">or</span>
        <div className="h-px flex-1 bg-sky-100" />
      </div>

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3.5">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500/60" />
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-2xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-500/50 focus:border-sky-300"
          />
        </div>

        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500/60" />
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-2xl border border-sky-100 bg-white pl-10 pr-11 text-sm text-ink-900 placeholder:text-ink-500/50 focus:border-sky-300"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-500/60 hover:text-ink-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              setForgotPassword(true);
              setResetEmail(email);
              setError(null);
            }}
            className="self-end text-xs font-medium text-sky-600 hover:underline"
          >
            Forgot password?
          </button>
        )}

        <div className="relative mt-1">
          <Button type="submit" size="lg" className="w-full" loading={loadingAction === "password"}>
            {mode === "login" ? "Log in" : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </Button>
          {lastProvider === "password" && mode === "login" && (
            <span className="absolute -top-2.5 right-3 rounded-full bg-sky-500 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-white shadow-soft">
              Last used
            </span>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {mode === "login" ? "New to Pixora?" : "Already have an account?"}{" "}
        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="font-medium text-sky-600 hover:underline"
        >
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-md animate-fade-up">
      <div className="mb-6 flex flex-col items-center">
        <RabbitMascot className="h-14 w-14" />
        <span className="mt-2 font-display text-2xl font-semibold text-ink-900">Pixora</span>
      </div>
      <div className="rounded-4xl border border-white/80 bg-white/80 p-7 shadow-float backdrop-blur-xl sm:p-9">
        {children}
      </div>
    </div>
  );
}