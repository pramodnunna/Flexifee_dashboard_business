"use client";

import { changePassword } from "@/app/actions/users";
import { useActionState } from "react";

function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { success?: boolean; error?: string } | null, formData: FormData) => {
      const result = await changePassword(formData);
      return result;
    },
    null
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {state?.error && (
        <div className="login-error">{state.error}</div>
      )}
      {state?.success && (
        <div style={{ background: "var(--success-bg)", color: "var(--success)", padding: "0.75rem", borderRadius: "10px", fontSize: "0.875rem", fontWeight: 600, textAlign: "center" }}>
          Password updated successfully!
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Current Password</label>
        <input
          type="password"
          name="currentPassword"
          className="form-input"
          required
          placeholder="••••••••"
        />
      </div>

      <div className="form-group">
        <label className="form-label">New Password</label>
        <input
          type="password"
          name="newPassword"
          className="form-input"
          required
          placeholder="••••••••"
          minLength={8}
        />
      </div>

      <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }} disabled={isPending}>
        {isPending ? "Updating..." : "Update Password"}
      </button>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
        Note: You will stay logged in after changing your password.
      </p>
    </form>
  );
}

export default function ChangePasswordCard() {
  return <ChangePasswordForm />;
}
