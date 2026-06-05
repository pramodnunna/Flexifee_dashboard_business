"use client";

import { logoutAction } from "@/app/actions/auth";

interface UserProfileProps {
  email: string;
  role: string;
}

export default function UserProfile({ email, role }: UserProfileProps) {
  const isAdmin = role === "admin";
  
  return (
    <div className="user-profile-widget" id="user-profile-info">
      <span className="user-email-text">{email}</span>
      <span className={`user-role-badge ${isAdmin ? 'user-role-badge-admin' : 'user-role-badge-ops'}`}>
        {isAdmin ? "Admin" : "Operations"}
      </span>
      <form action={logoutAction} style={{ display: "inline-flex" }}>
        <button type="submit" className="logout-btn" id="btn-logout">
          Logout
        </button>
      </form>
    </div>
  );
}
