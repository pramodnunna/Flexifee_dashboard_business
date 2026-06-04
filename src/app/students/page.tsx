export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import ExportButton from "@/components/ExportButton";
import Link from "next/link";
import { cookies } from "next/headers";
import { deboardStudent } from "../actions/deboard";

export default async function StudentsPage() {
  const cookieStore = await cookies();
  const isAdmin = (cookieStore.get("role")?.value || "admin") === "admin";

  const students = await prisma.student.findMany({
    include: {
      school: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalLoanAmt = students.reduce((acc, sum) => acc + sum.loanAmount, 0);
  const avgLoan = students.length > 0 ? totalLoanAmt / students.length : 0;
  
  const totalFees = students.reduce((acc, sum) => acc + sum.annualFee, 0);
  const avgFee = students.length > 0 ? totalFees / students.length : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Students Analytics</h1>
          <p style={{ color: "var(--text-secondary)" }}>Financing details and statistics at the student level.</p>
        </div>
        <a href="/students/onboard" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>Onboard Student</a>
      </div>

      <div className="kpi-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Average Fee Size</span>
          </div>
          <div className="kpi-value">₹{avgFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Average Loan Size</span>
          </div>
          <div className="kpi-value">₹{avgLoan.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Total Active Students</span>
          </div>
          <div className="kpi-value">{students.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Student Loans</h2>
          <ExportButton 
            filename="student_loans"
            data={students.map((s) => ({
              ID: s.id,
              Name: s.name,
              School: s.school.name,
              AnnualFee: s.annualFee,
              EMITenure: s.emiTenureMonths,
              AdvEMI: s.advanceEmi,
              Status: s.status
            }))}
          />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Student Name</th>
                <th>School</th>
                <th>Annual Fee</th>
                <th>Financed Amount</th>
                <th>EMI Details</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={student.status === 'Inactive' ? { opacity: 0.6 } : undefined}>
                  <td>
                    <Link href={`/students/${student.id}`} style={{ textDecoration: 'none' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>{student.code}</span>
                    </Link>
                  </td>
                  <td style={{ fontWeight: 500 }}>{student.name}</td>
                  <td>{student.school.name}</td>
                  <td>₹{student.annualFee.toLocaleString('en-IN')}</td>
                  <td>₹{student.loanAmount.toLocaleString('en-IN')}</td>
                  <td>{student.emiTenureMonths} Months ({student.advanceEmi} Adv)</td>
                  <td>
                    <span className={`badge ${student.status === 'Active' ? 'badge-success' : student.status === 'Defaulted' ? 'badge-warning' : 'badge-warning'}`}>
                      {student.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      {student.status === 'Active' ? (
                        <form action={deboardStudent}>
                          <input type="hidden" name="id" value={student.id} />
                          <button type="submit" className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", backgroundColor: "var(--destructive)", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>
                            Deboard
                          </button>
                        </form>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Deboarded</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>No students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
