export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import ExportButton from "@/components/ExportButton";
import DashboardAnalytics from "@/components/DashboardAnalytics";

// Utility to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default async function Dashboard() {
  const [
    totalSchools,
    totalStudents,
    totalPartners,
    transactions,
    cutoffs
  ] = await Promise.all([
    prisma.school.count(),
    prisma.student.count(),
    prisma.partner.count(),
    prisma.transaction.findMany({
      include: {
        student: { select: { name: true, code: true } },
        school: { select: { name: true, code: true } },
        partner: { select: { name: true, code: true } }
      },
      orderBy: { date: 'desc' }
    }),
    prisma.financeCutoff.findMany({ orderBy: [{ tenure: 'asc' }, { advanceEmi: 'asc' }] })
  ]);

  const gmv = transactions.reduce((acc, tx) => acc + tx.feeAmount, 0);
  const grossRevenue = transactions.reduce((acc, tx) => acc + tx.revenueEarned, 0);
  const totalCommission = transactions.reduce((acc, tx) => acc + tx.commissionPaid, 0);
  const totalBankCommission = transactions.reduce((acc, tx) => acc + tx.bankCommission, 0);
  const netRevenue = grossRevenue - totalCommission + totalBankCommission;

  // Serialize transactions for client-side analytics
  const serializedTransactions = transactions.map(tx => ({
    id: tx.id,
    date: tx.date.toISOString(),
    feeAmount: tx.feeAmount,
    discountApplied: tx.discountApplied,
    revenueEarned: tx.revenueEarned,
    commissionPaid: tx.commissionPaid,
    bankCommission: tx.bankCommission,
    studentName: tx.student.name,
    studentCode: tx.student.code,
    schoolName: tx.school.name,
    partnerName: tx.partner?.name || null,
    partnerCode: tx.partner?.code || null,
  }));

  return (
    <div>
      {/* Hero Banner */}
      <div className="page-hero">
        <h1>Welcome back, Admin 👋</h1>
        <p>Here&apos;s your live subvention engine overview. All metrics are calculated in real-time.</p>
      </div>

      {/* Main KPI Row */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--primary)' } as React.CSSProperties}>
          <div className="kpi-icon kpi-icon-blue">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div className="kpi-label">Schools Onboarded</div>
          <div className="kpi-value">{totalSchools}</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--info)' } as React.CSSProperties}>
          <div className="kpi-icon kpi-icon-indigo">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div className="kpi-label">Students Financed</div>
          <div className="kpi-value">{totalStudents}</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--success)' } as React.CSSProperties}>
          <div className="kpi-icon kpi-icon-green">
            <span className="material-symbols-outlined">handshake</span>
          </div>
          <div className="kpi-label">Active Partners</div>
          <div className="kpi-value">{totalPartners}</div>
        </div>
      </div>

      {/* Financial KPI Row */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--primary)' } as React.CSSProperties}>
          <div className="kpi-icon kpi-icon-blue">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div className="kpi-label">Fee Volume (GMV)</div>
          <div className="kpi-value">{formatCurrency(gmv)}</div>
          <div className="kpi-sub">{transactions.length} transactions processed</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--success)' } as React.CSSProperties}>
          <div className="kpi-icon kpi-icon-green">
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div className="kpi-label">Gross Revenue</div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{formatCurrency(grossRevenue)}</div>
          <div className="kpi-sub">From subvention margins</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--destructive)' } as React.CSSProperties}>
          <div className="kpi-icon kpi-icon-red">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div className="kpi-label">Commission Paid</div>
          <div className="kpi-value" style={{ color: 'var(--destructive)' }}>{formatCurrency(totalCommission)}</div>
          <div className="kpi-sub">Partner revenue share payouts</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#F59E0B' } as React.CSSProperties}>
          <div className="kpi-icon kpi-icon-amber">
            <span className="material-symbols-outlined">account_balance</span>
          </div>
          <div className="kpi-label">Bank Commission</div>
          <div className="kpi-value" style={{ color: '#B45309' }}>{formatCurrency(totalBankCommission)}</div>
          <div className="kpi-sub">1% of fee volume earned</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--primary)', borderColor: 'var(--primary)', borderWidth: '2px' } as React.CSSProperties}>
          <div className="kpi-icon kpi-icon-blue">
            <span className="material-symbols-outlined">diamond</span>
          </div>
          <div className="kpi-label">Net Revenue</div>
          <div className="kpi-value" style={{ color: 'var(--primary)' }}>{formatCurrency(netRevenue)}</div>
          <div className="kpi-sub">After all partner payouts</div>
        </div>
      </div>

      {/* Interactive Charts */}
      <DashboardAnalytics transactions={serializedTransactions} />

      {/* Finance Company Cutoff Reference */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">Finance Company Subvention Matrix</h2>
          <span className="badge badge-info">Reference</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {cutoffs.map(c => (
            <div key={c.id} style={{
              background: 'var(--bg-color)',
              padding: '1.25rem',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid var(--border-light)',
              transition: 'var(--transition-smooth)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.375rem' }}>{c.tenure}M / {c.advanceEmi} Adv EMI</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--destructive)', letterSpacing: '-0.02em' }}>{c.subvention}%</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.375rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cutoff Rate</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Ledger */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Transaction Ledger</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <ExportButton
              filename="transactions_ledger"
              data={transactions.map(tx => ({
                Date: new Date(tx.date).toLocaleDateString(),
                Student: `${tx.student.name} (${tx.student.code})`,
                School: tx.school.name,
                Partner: tx.partner ? `${tx.partner.name} (${tx.partner.code})` : 'Direct',
                FeeAmount: tx.feeAmount,
                DiscountApplied: tx.discountApplied + '%',
                Revenue: tx.revenueEarned,
                PartnerCommission: tx.commissionPaid,
                BankCommission: tx.bankCommission,
                NetProfit: tx.revenueEarned - tx.commissionPaid - tx.bankCommission
              }))}
            />
            <a href="/transactions" className="btn btn-secondary">View All</a>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>School</th>
                <th>Partner</th>
                <th>Fee Amount</th>
                <th>Discount %</th>
                <th>Revenue</th>
                <th>Partner Comm.</th>
                <th>Bank Comm.</th>
                <th>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tx.student.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 500 }}>{tx.student.code}</div>
                  </td>
                  <td>{tx.school.name}</td>
                  <td>
                    {tx.partner
                      ? (
                        <>
                          <div>{tx.partner.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{tx.partner.code}</div>
                        </>
                      )
                      : <span style={{ color: 'var(--text-muted)' }}>Direct</span>
                    }
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(tx.feeAmount)}</td>
                  <td><span className="badge badge-info">{tx.discountApplied}%</span></td>
                  <td style={{ color: "var(--success)", fontWeight: 700 }}>+{formatCurrency(tx.revenueEarned)}</td>
                  <td style={{ color: "var(--destructive)", fontWeight: 600 }}>-{formatCurrency(tx.commissionPaid)}</td>
                  <td style={{ color: "var(--success)", fontWeight: 600 }}>+{formatCurrency(tx.bankCommission)}</td>
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(tx.revenueEarned - tx.commissionPaid + tx.bankCommission)}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: '0.75rem' }}>receipt_long</span>
                    No transactions yet. Onboard a student to generate your first ledger entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
