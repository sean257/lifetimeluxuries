"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { requestPasswordReset, signIn, type AuthState } from "@/app/actions/auth";
import { Field, FormMessage, inputClass } from "@/components/admin/form-bits";

export function LoginForm({ next, linkError }: { next: string; linkError?: string }) {
  const [mode, setMode] = useState<"signin" | "reset">(linkError ? "reset" : "signin");
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [resetState, resetAction, sendingReset] = useActionState<AuthState, FormData>(requestPasswordReset, {});

  if (mode === "reset") {
    return (
      <form action={resetAction} className="grid gap-4" noValidate>
        <div className="eyebrow">Owner sign-in</div>
        <h1 className="text-4xl">Reset your password</h1>
        <p className="text-sm text-muted">Enter your email and we&apos;ll send you a link to choose a new password.</p>
        <Field id="reset-email" label="Email">
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={resetState.email ?? signInState.email}
            aria-invalid={!!resetState.error}
            aria-describedby="reset-msg"
            className={inputClass}
          />
        </Field>
        <FormMessage id="reset-msg" error={resetState.error ?? (resetState.message ? undefined : linkError)} message={resetState.message} />
        <button type="submit" className="btn btn-solid w-full" disabled={sendingReset}>
          {sendingReset ? "Sending…" : "Send reset link"}
        </button>
        <button type="button" className="btn btn-ghost w-full" onClick={() => setMode("signin")}>
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form action={signInAction} className="grid gap-4" noValidate>
      <div className="eyebrow">Owner sign-in</div>
      <h1 className="text-4xl">Sign in</h1>
      <input type="hidden" name="next" value={next} />
      <Field id="login-email" label="Email">
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={signInState.email}
          aria-invalid={!!signInState.error}
          aria-describedby="login-msg"
          className={inputClass}
        />
      </Field>
      <Field id="login-password" label="Password">
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!signInState.error}
          aria-describedby="login-msg"
          className={inputClass}
        />
      </Field>
      <FormMessage id="login-msg" error={signInState.error} />
      <button type="submit" className="btn btn-solid w-full" disabled={signingIn}>
        {signingIn ? "Signing in…" : "Sign in"}
      </button>
      <button
        type="button"
        className="min-h-11 justify-self-center px-2 text-[13px] text-muted underline hover:text-ink"
        onClick={() => setMode("reset")}
      >
        Forgot password?
      </button>
      <Link href="/" className="btn btn-ghost w-full">
        Back to shop
      </Link>
    </form>
  );
}
