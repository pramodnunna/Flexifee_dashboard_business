export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { submitStudent } from "./actions";

export default async function OnboardStudentPage({ searchParams }: { searchParams?: { error?: string } }) {
  const schools = await prisma.school.findMany({
    where: { status: 'Active' },
    orderBy: { name: 'asc' }
  });

  const partners = await prisma.partner.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Onboard Student & Financier</h1>
        <p style={{ color: "var(--text-secondary)" }}>Process a new loan and instantly calculate gross revenue margin based on the school's subvention setup.</p>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        {searchParams?.error && (
          <div style={{ backgroundColor: 'var(--warning-color)', padding: '1rem', borderRadius: '6px', color: '#fff', marginBottom: '1.5rem', fontWeight: 500 }}>
             🚨 Error: {searchParams.error}
          </div>
        )}

        <form action={submitStudent} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Student Name</label>
              <input type="text" name="name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select School</label>
              <select name="schoolId" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="">-- Choose a School --</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
             <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Total Annual Fee Setup</label>
              <input type="number" name="annualFee" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>

             <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Approved Loan Amount</label>
              <input type="number" name="loanAmount" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
             <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>EMI Tenure (Months)</label>
              <select name="tenure" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="6">6 Months</option>
                <option value="8">8 Months</option>
                <option value="10">10 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>

             <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Advance EMIs paid upfront</label>
              <select name="advanceEmi" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="1">1 Advance EMI</option>
                <option value="2">2 Advance EMIs</option>
              </select>
            </div>
             <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                Note: The core subvention engine will verify this exact matrix against the School's active setup and compute the profit mathematically.
             </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
             <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Override Source Partner (Optional)</label>
             <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                If an Independent Agent brought in this specific loan, select them here to override the school's baseline owner. Do NOT select if direct.
             </p>
             <select name="partnerId" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="">-- No Independent Agent --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <a href="/students" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>Cancel</a>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Calculate & Commit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
