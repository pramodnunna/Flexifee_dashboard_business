"use client";

import React, { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  // Quick Login triggers for demo and automated E2E tests
  const handleQuickLogin = (email: string, role: string) => {
    const emailInput = document.getElementById("email-input") as HTMLInputElement;
    const passwordInput = document.getElementById("password-input") as HTMLInputElement;
    const form = document.getElementById("login-form") as HTMLFormElement;

    if (emailInput && passwordInput && form) {
      emailInput.value = email;
      passwordInput.value = role === "admin" ? "Flexifee@2026" : role === "partner" ? "partner123" : "ops123";
      form.requestSubmit(); // Triggers form action submission properly
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Brand Logo */}
        <img
          src="/flexifee-logo.png"
          alt="Flexifee Logo"
          className="login-logo"
        />
        
        <h1 className="login-title">Sign In</h1>
        <p className="login-subtitle">Access your internal Flexifee portal</p>

        {state?.error && (
          <div className="login-error" id="login-error-message">
            {state.error}
          </div>
        )}

        <form action={formAction} className="login-form" id="login-form">
          <div className="form-group">
            <label htmlFor="email-input" className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              id="email-input"
              className="form-input"
              placeholder="name@flexifee.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="password-input" className="form-label">Password</label>
            <input
              type="password"
              name="password"
              id="password-input"
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.9375rem" }}
            disabled={isPending}
            id="btn-login-submit"
          >
            {isPending ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Quick Login Section */}
        <div className="quick-login-divider">Demo Accounts</div>
        <div className="quick-login-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleQuickLogin("Admin@flexifee.in", "admin")}
            style={{ padding: "0.5rem 0.25rem", fontSize: "0.75rem" }}
            id="btn-quick-admin"
          >
            Admin
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleQuickLogin("ops@flexifee.in", "ops")}
            style={{ padding: "0.5rem 0.25rem", fontSize: "0.75rem" }}
            id="btn-quick-ops"
          >
            Ops
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleQuickLogin("partner@flexifee.in", "partner")}
            style={{ padding: "0.5rem 0.25rem", fontSize: "0.75rem" }}
            id="btn-quick-partner"
          >
            Partner
          </button>
        </div>
      </div>
    </div>
  );
}
