import { prisma } from "@/lib/prisma";
import ExportButton from "@/components/ExportButton";

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
  const netRevenue = grossRevenue - totalCommission - totalBankCommission;
  const avgProfitMargin = transactions.length > 0
    ? transactions.reduce((acc, tx) => acc + tx.discountApplied, 0) / transactions.length
    : 0;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Dashboard Overview</h1>
        <p style={{ color: "var(--text-secondary)" }}>Live subvention engine metrics. All calculations are real-time.</p>
      </div>

      {/* Main KPI Row */}
      <div className="kpi-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Schools</span>
            <span className="badge badge-info">Onboarded</span>
          </div>
          <div className="kpi-value">{totalSchools}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Students</span>
            <span className="badge badge-info">Financed</span>
          </div>
          <div className="kpi-value">{totalStudents}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Partners</span>
            <span className="badge badge-info">Active</span>
          </div>
          <div className="kpi-value">{totalPartners}</div>
        </div>
      </div>

      {/* Financial KPI Row */}
      <div className="kpi-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Fee Volume (GMV)</span>
          </div>
          <div className="kpi-value">{formatCurrency(gmv)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{transactions.length} transactions processed</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Gross Revenue</span>
            <span className="badge badge-success">Earned</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--secondary)' }}>{formatCurrency(grossRevenue)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>From subvention margins</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Commission Paid</span>
            <span className="badge badge-warning">Outflow</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--destructive)' }}>{formatCurrency(totalCommission)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Partner revenue share payouts</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Bank Commission</span>
            <span className="badge badge-warning">Outflow</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--destructive)' }}>{formatCurrency(totalBankCommission)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>1% of fee volume</div>
        </div>

        <div className="card" style={{ border: '2px solid var(--primary)' }}>
          <div className="card-header">
            <span className="card-title">Net Revenue</span>
            <span className="badge badge-success">Retained</span>
          </div>
          <div className="kpi-value">{formatCurrency(netRevenue)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>After all partner payouts</div>
        </div>
      </div>

      {/* Finance Company Cutoff Reference */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">Finance Company Subvention Matrix</h2>
          <span className="badge badge-info">Reference</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {cutoffs.map(c => (
            <div key={c.id} style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{c.tenure}M / {c.advanceEmi} Adv EMI</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--destructive)' }}>{c.subvention}%</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Cutoff Rate</div>
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
                    <div style={{ fontWeight: 500 }}>{tx.student.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'monospace' }}>{tx.student.code}</div>
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
                  <td>{formatCurrency(tx.feeAmount)}</td>
                  <td style={{ fontWeight: 600 }}>{tx.discountApplied}%</td>
                  <td style={{ color: "var(--secondary)", fontWeight: 600 }}>+{formatCurrency(tx.revenueEarned)}</td>
                  <td style={{ color: "var(--destructive)" }}>-{formatCurrency(tx.commissionPaid)}</td>
                  <td style={{ color: "var(--destructive)" }}>-{formatCurrency(tx.bankCommission)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(tx.revenueEarned - tx.commissionPaid - tx.bankCommission)}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "2rem" }}>No transactions yet. Onboard a student to generate your first ledger entry.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
