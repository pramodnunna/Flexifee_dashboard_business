export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { submitStudent } from "./actions";
import StudentImportForm from "@/components/StudentImportForm";
import StudentOnboardForm from "@/components/StudentOnboardForm";

export default async function OnboardStudentPage({ searchParams }: { searchParams?: Promise<{ error?: string; tab?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams?.tab === 'bulk' ? 'bulk' : 'single';
  const error = resolvedSearchParams?.error;

  const schools = await prisma.school.findMany({
    where: { status: 'Active' },
    include: { discounts: true },
    orderBy: { name: 'asc' }
  });

  const partners = await prisma.partner.findMany({
    where: { status: 'Active' },
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Onboard Student & Financier</h1>
        <p style={{ color: "var(--text-secondary)" }}>Process a new loan and instantly calculate gross revenue margin based on the school's subvention setup.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <a href="?tab=single" style={{
          padding: '0.75rem 1rem',
          textDecoration: 'none',
          color: activeTab === 'single' ? 'var(--primary)' : 'var(--text-secondary)',
          borderBottom: activeTab === 'single' ? '2px solid var(--primary)' : 'none',
          fontWeight: 600
        }}>
          Single Student Onboard
        </a>
        <a href="?tab=bulk" style={{
          padding: '0.75rem 1rem',
          textDecoration: 'none',
          color: activeTab === 'bulk' ? 'var(--primary)' : 'var(--text-secondary)',
          borderBottom: activeTab === 'bulk' ? '2px solid var(--primary)' : 'none',
          fontWeight: 600
        }}>
          Bulk Import (Excel/CSV)
        </a>
      </div>

      {activeTab === 'single' ? (
        <div className="card" style={{ maxWidth: '800px' }}>
          <StudentOnboardForm
            schools={schools}
            partners={partners}
            submitAction={submitStudent}
            error={error}
          />
        </div>
      ) : (
        <div className="card" style={{ maxWidth: '800px' }}>
          <StudentImportForm />
        </div>
      )}
    </div>
  );
}
