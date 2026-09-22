export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import ExportButton from "@/components/ExportButton";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    include: {
      student: { select: { name: true, code: true, emiTenureMonths: true, advanceEmi: true } },
      school: { select: { name: true, code: true } },
      partner: { select: { name: true, code: true, defaultCommission: true } }
    },
    orderBy: { date: 'desc' }
  });

  const totalRevenue = transactions.reduce((acc, tx) => acc + tx.revenueEarned, 0);
  const totalCommission = transactions.reduce((acc, tx) => acc + (tx.commissionAmount || tx.commissionPaid || 0), 0);
  const totalBankCommission = transactions.reduce((acc, tx) => acc + tx.bankCommission, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Transactions Ledger</h1>
          <p style={{ color: "var(--text-secondary)" }}>Complete audit trail of all financing transactions with subvention and loan commission calculations.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Total Transactions</span></div>
          <div className="kpi-value">{transactions.length}</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Gross Revenue</span></div>
          <div className="kpi-value" style={{ color: 'var(--secondary)' }}>{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Partner Commission</span></div>
          <div className="kpi-value" style={{ color: 'var(--destructive)' }}>{formatCurrency(totalCommission)}</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Bank Commission</span></div>
          <div className="kpi-value" style={{ color: 'var(--secondary)' }}>{formatCurrency(totalBankCommission)}</div>
        </div>
        <div className="card" style={{ border: '2px solid var(--primary)' }}>
          <div className="card-header"><span className="card-title">Net Retained</span></div>
          <div className="kpi-value">{formatCurrency(totalRevenue - totalCommission + totalBankCommission)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Transactions</h2>
          <ExportButton
            filename="all_transactions"
            data={transactions.map(tx => ({
              Date: new Date(tx.date).toLocaleDateString(),
              Student: `${tx.student.name} (${tx.student.code})`,
              School: tx.school.name,
              Partner: tx.partner ? `${tx.partner.name} (${tx.partner.code})` : 'Direct',
              CommissionRate: tx.partner ? (tx.commissionRate || tx.partner.defaultCommission) + '%' : 'N/A',
              EMI: `${tx.student.emiTenureMonths}M/${tx.student.advanceEmi}A`,
              LoanAmount: tx.loanAmount || 0,
              FeeAmount: tx.feeAmount,
              SchoolDiscount: tx.discountApplied + '%',
              Revenue: tx.revenueEarned,
              PartnerCommission: tx.commissionAmount || tx.commissionPaid,
              CommissionStatus: tx.commissionStatus || 'Pending',
              BankCommission: tx.bankCommission,
              NetProfit: tx.revenueEarned - (tx.commissionAmount || tx.commissionPaid) + tx.bankCommission
            }))}
          />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>School</th>
                <th>EMI Config</th>
                <th>Partner</th>
                <th>Loan Amount</th>
                <th>School Discount</th>
                <th>Revenue</th>
                <th>Partner Comm.</th>
                <th>Comm. Status</th>
                <th>Bank Comm.</th>
                <th>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => {
                const comm = tx.commissionAmount || tx.commissionPaid || 0;
                const status = tx.commissionStatus || 'Pending';
                const statusBadge = status === 'Paid' ? 'badge-success' : status === 'Payable' ? 'badge-info' : 'badge-warning';
                const net = tx.revenueEarned - comm + tx.bankCommission;
                return (
                  <tr key={tx.id}>
                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tx.student.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'monospace' }}>{tx.student.code}</div>
                    </td>
                    <td>{tx.school.name}</td>
                    <td>
                      <span className="badge badge-info">{tx.student.emiTenureMonths}M / {tx.student.advanceEmi}A</span>
                    </td>
                    <td>
                      {tx.partner
                        ? (
                          <>
                            <div>{tx.partner.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({tx.commissionRate || tx.partner.defaultCommission}%)</span></div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{tx.partner.code}</div>
                          </>
                        )
                        : <span style={{ color: 'var(--text-muted)' }}>Direct</span>
                      }
                    </td>
                    <td>{formatCurrency(tx.loanAmount || 0)}</td>
                    <td style={{ fontWeight: 600 }}>{tx.discountApplied}%</td>
                    <td style={{ color: "var(--secondary)", fontWeight: 600 }}>+{formatCurrency(tx.revenueEarned)}</td>
                    <td style={{ color: "var(--destructive)" }}>-{formatCurrency(comm)}</td>
                    <td><span className={`badge ${statusBadge}`}>{status}</span></td>
                    <td style={{ color: "var(--secondary)" }}>+{formatCurrency(tx.bankCommission)}</td>
                    <td style={{ fontWeight: 700, color: net >= 0 ? 'var(--primary)' : 'var(--destructive)' }}>
                      {formatCurrency(net)}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: "2rem" }}>No transactions yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
