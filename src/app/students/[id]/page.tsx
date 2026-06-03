import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id: id },
    include: {
      school: true,
      transactions: true,
    }
  });

  if (!student) {
    notFound();
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Student Details</h1>
          <p style={{ color: "var(--text-secondary)" }}>View comprehensive details for {student.name}.</p>
        </div>
        <Link href="/students" className="btn btn-secondary" style={{ padding: "0.75rem 1.5rem", textDecoration: "none" }}>
          Back to Students
        </Link>
      </div>

      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <h2 className="card-title">General Information</h2>
        </div>
        <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Student Name</p>
            <p style={{ fontWeight: 500 }}>{student.name}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Student Code</p>
            <p style={{ fontFamily: "monospace", color: "var(--primary)" }}>{student.code}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>School Name</p>
            <p style={{ fontWeight: 500 }}>{student.school.name}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Status</p>
            <span className={`badge ${student.status === 'Active' ? 'badge-success' : student.status === 'Defaulted' ? 'badge-warning' : 'badge-info'}`}>
              {student.status}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <h2 className="card-title">Financial Details</h2>
        </div>
        <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Annual Fee</p>
            <p style={{ fontWeight: 500 }}>₹{student.annualFee.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Loan Amount</p>
            <p style={{ fontWeight: 500 }}>₹{student.loanAmount.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>EMI Tenure</p>
            <p style={{ fontWeight: 500 }}>{student.emiTenureMonths} Months</p>
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Advance EMI</p>
            <p style={{ fontWeight: 500 }}>{student.advanceEmi}</p>
          </div>
        </div>
      </div>

      {student.transactions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Transactions</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fee Amount</th>
                  <th>Discount Applied</th>
                  <th>Revenue Earned</th>
                  <th>Partner Commission</th>
                  <th>Bank Commission</th>
                  <th>Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {student.transactions.map(t => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td>₹{t.feeAmount.toLocaleString('en-IN')}</td>
                    <td>₹{t.discountApplied.toLocaleString('en-IN')}</td>
                    <td>₹{t.revenueEarned.toLocaleString('en-IN')}</td>
                    <td style={{ color: "var(--destructive)" }}>-₹{t.commissionPaid.toLocaleString('en-IN')}</td>
                    <td style={{ color: "var(--secondary)" }}>+₹{t.bankCommission.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 600, color: (t.revenueEarned - t.commissionPaid + t.bankCommission) >= 0 ? 'var(--primary)' : 'var(--destructive)' }}>₹{(t.revenueEarned - t.commissionPaid + t.bankCommission).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {student.transactions.length === 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Transactions</h2>
          </div>
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
            No transactions found for this student.
          </div>
        </div>
      )}
    </div>
  );
}
