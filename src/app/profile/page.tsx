import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import ChangePasswordCard from "@/components/ChangePasswordForm";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const email = cookieStore.get("auth_email")?.value;
  
  if (!email) {
    return null; // Will be redirected by middleware
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, email: true, role: true, createdAt: true }
  });

  if (!user) return null;

  return (
    <div className="profile-page">
      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <h1>My Profile</h1>
        <p style={{ color: "var(--text-secondary)" }}>Manage your account settings and password.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", maxWidth: "900px" }}>
        {/* Profile Info Card */}
        <div className="card">
          <h2 style={{ marginBottom: "1rem" }}>Account Information</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <span style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)" }}>Full Name</span>
              <strong style={{ fontSize: "1.125rem" }}>{user.name}</strong>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)" }}>Email Address</span>
              <span style={{ fontSize: "1.125rem" }}>{user.email}</span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)" }}>Role</span>
              <span className={`badge ${user.role === "admin" ? "badge-info" : "badge-success"}`} style={{ marginTop: "0.25rem" }}>
                {user.role}
              </span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)" }}>Member Since</span>
              <span style={{ fontSize: "1.125rem" }}>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h2 style={{ marginBottom: "1rem" }}>Change Password</h2>
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}
