"use client";

import { createUser } from "@/app/actions/users";
import { useActionState } from "react";

export default function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { success?: boolean; error?: string } | null, formData: FormData) => {
      const result = await createUser(formData);
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
          User created successfully!
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input type="text" name="name" className="form-input" required placeholder="John Doe" />
      </div>

      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input type="email" name="email" className="form-input" required placeholder="ops@flexifee.in" />
      </div>

      <div className="form-group">
        <label className="form-label">Temporary Password</label>
        <input type="password" name="password" className="form-input" required placeholder="••••••••" />
      </div>

      <input type="hidden" name="role" value="ops" />

      <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }} disabled={isPending}>
        {isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
