import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import RoleSelector from "@/components/RoleSelector";

export const metadata: Metadata = {
  title: "FlexiFee Dashboard",
  description: "Internal dashboard for managing schools, students, and partners for FlexiFee edufintech.",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  // Simple hack to detect active without client component for now
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
  const cookieStore = await cookies();
  const currentRole = cookieStore.get("role")?.value || "admin";

  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="brand">
              FlexiFee
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
                <RoleSelector currentRole={currentRole} />
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
