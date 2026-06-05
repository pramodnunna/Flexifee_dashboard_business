import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import UserProfile from "@/components/UserProfile";

export const metadata: Metadata = {
  title: "FlexiFee Dashboard",
  description: "Internal dashboard for managing schools, students, and partners for FlexiFee edufintech.",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="nav-item">
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
              <ul>
                <li><NavLink href="/">Dashboard</NavLink></li>
                <li><NavLink href="/schools">Schools</NavLink></li>
                <li><NavLink href="/partners">Partners</NavLink></li>
                <li><NavLink href="/students">Students</NavLink></li>
                <li><NavLink href="/transactions">Transactions</NavLink></li>
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
