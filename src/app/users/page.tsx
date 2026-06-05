import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CreateUserForm from "@/components/CreateUserForm";

export default async function UsersPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "admin") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="users-page">
      <header className="page-header" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>User Management</h1>
          <p style={{ color: "var(--text-secondary)" }}>Manage Ops users and their access.</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem" }}>
        <div className="card">
          <h2 style={{ marginBottom: "1rem" }}>Current Users</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "0.75rem 0" }}>Name</th>
                <th style={{ padding: "0.75rem 0" }}>Email</th>
                <th style={{ padding: "0.75rem 0" }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "0.75rem 0" }}>{u.name}</td>
                  <td style={{ padding: "0.75rem 0" }}>{u.email}</td>
                  <td style={{ padding: "0.75rem 0" }}>
                    <span className={`badge ${u.role === "admin" ? "badge-info" : "badge-success"}`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: "1rem" }}>Create Ops User</h2>
          <CreateUserForm />
        </div>
      </div>
    </div>
  );
}
