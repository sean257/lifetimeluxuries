"use client";
import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/app/actions/auth";
import { Field, FormMessage, inputClass } from "@/components/admin/form-bits";

export function ResetPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="eyebrow">Owner sign-in</div>
      <h1 className="text-4xl">Choose a new password</h1>
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <Field id="new-password" label="New password">
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={!!state.error}
          aria-describedby="new-password-hint reset-msg"
          className={inputClass}
        />
      </Field>
      <p id="new-password-hint" className="-mt-2 text-xs text-muted">
        At least 8 characters.
      </p>
      <Field id="confirm-password" label="Type it again">
        <input
          id="confirm-password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!state.error}
          aria-describedby="reset-msg"
          className={inputClass}
        />
      </Field>
      <FormMessage id="reset-msg" error={state.error} />
      <button type="submit" className="btn btn-solid w-full" disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
