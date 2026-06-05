import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import UserProfile from "@/components/UserProfile";

export const metadata: Metadata = {
  title: "FlexiFee Dashboard",
  description: "Internal dashboard for managing schools, students, and partners for FlexiFee edufintech.",
};

function NavLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="nav-item">
      <span className="material-symbols-outlined">{icon}</span>
      {children}
    </Link>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";
  const isLoginPage = pathname === "/login";

  const cookieStore = await cookies();
  const currentRole = cookieStore.get("role")?.value || "admin";
  const currentEmail = cookieStore.get("auth_email")?.value || (currentRole === "admin" ? "admin@flexifee.com" : "ops@flexifee.com");

  if (isLoginPage) {
    return (
      <html lang="en">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        </head>
        <body>
          <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
            {children}
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="sidebar-logo-container">
              <img
                src="/flexifee-logo.png"
                alt="Flexifee Logo"
                className="sidebar-logo"
              />
            </div>
            <nav className="nav-links">
              <div className="nav-section-label">Main</div>
              <ul>
                <li><NavLink href="/" icon="dashboard">Dashboard</NavLink></li>
                <li><NavLink href="/schools" icon="school">Schools</NavLink></li>
                <li><NavLink href="/partners" icon="handshake">Partners</NavLink></li>
                <li><NavLink href="/students" icon="group">Students</NavLink></li>
                <li><NavLink href="/transactions" icon="receipt_long">Transactions</NavLink></li>
              </ul>
              <div className="nav-section-label">Settings</div>
              <ul>
                {currentRole === "admin" && (
                  <li><NavLink href="/users" icon="manage_accounts">Users</NavLink></li>
                )}
                <li><NavLink href="/profile" icon="person">Profile</NavLink></li>
              </ul>
            </nav>
          </aside>
          
          <main className="main-content">
            <header className="top-header">
              <div className="search-bar">
                {/* Search placeholder */}
              </div>
              <div className="user-profile">
                <UserProfile email={currentEmail} role={currentRole} />
              </div>
            </header>
            
            <div className="page-container">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
