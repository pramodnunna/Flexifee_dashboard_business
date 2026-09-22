export const dynamic = 'force-dynamic';

import React from 'react';
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import ExportButton from "@/components/ExportButton";
import PrintButton from "@/components/PrintButton";
import PartnerSelector from "@/components/PartnerSelector";

export default async function PartnerDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ partnerId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const currentRole = cookieStore.get("role")?.value || "admin";
  const authEmail = cookieStore.get("auth_email")?.value || "";
  let cookiePartnerId = cookieStore.get("partner_id")?.value;

  // Fetch all active partners for selector if admin
  const allPartners = await prisma.partner.findMany({
    select: { id: true, name: true, code: true, contactInfo: true },
    orderBy: { name: 'asc' }
  });

  // Determine target partner ID
  let targetPartnerId = resolvedSearchParams?.partnerId || cookiePartnerId;

  if (!targetPartnerId && authEmail) {
    const linkedUser = await prisma.user.findFirst({
      where: { email: { equals: authEmail, mode: 'insensitive' } },
      select: { partnerId: true }
    });
    if (linkedUser?.partnerId) {
      targetPartnerId = linkedUser.partnerId;
    }
  }

  // Fallback to first partner if non-specified or not found
  if (!targetPartnerId && allPartners.length > 0) {
    targetPartnerId = allPartners[0].id;
  }

  const partner = targetPartnerId
    ? await prisma.partner.findUnique({
        where: { id: targetPartnerId },
        include: {
          onboardedSchools: {
            include: {
              students: true,
              transactions: true,
            }
          },
          transactions: {
            include: {
              student: true,
              school: true
            },
            orderBy: { date: 'desc' }
          }
        }
      })
    : null;

  if (!partner) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Partner Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>
          No partner record found or linked to your account ({authEmail}). Please contact support or select a valid partner.
        </p>
      </div>
    );
  }

  // Calculate metrics
  const onboardedSchoolsCount = partner.onboardedSchools.length;
  const directTransactions = partner.transactions;

  const totalBusinessLoanVolume = directTransactions.reduce((sum, tx) => sum + (tx.loanAmount || 0), 0);
  const totalCommissionEarned = directTransactions.reduce((sum, tx) => sum + (tx.commissionAmount || tx.commissionPaid || 0), 0);
  
  const pendingCommission = directTransactions
    .filter(tx => tx.commissionStatus === 'Pending')
    .reduce((sum, tx) => sum + (tx.commissionAmount || tx.commissionPaid || 0), 0);
  
  const payableCommission = directTransactions
    .filter(tx => tx.commissionStatus === 'Payable')
    .reduce((sum, tx) => sum + (tx.commissionAmount || tx.commissionPaid || 0), 0);

  const paidCommission = directTransactions
    .filter(tx => tx.commissionStatus === 'Paid')
    .reduce((sum, tx) => sum + (tx.commissionAmount || tx.commissionPaid || 0), 0);

  const totalStudentsFinanced = partner.onboardedSchools.reduce(
    (sum, school) => sum + school.students.length,
    0
  );

  // Month-wise statement aggregation
  const monthlyData: Record<string, { month: string; dealCount: number; loanVolume: number; commission: number }> = {};

  directTransactions.forEach(tx => {
    const dateObj = new Date(tx.date);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthName, dealCount: 0, loanVolume: 0, commission: 0 };
    }

    monthlyData[monthKey].dealCount += 1;
    monthlyData[monthKey].loanVolume += (tx.loanAmount || 0);
    monthlyData[monthKey].commission += (tx.commissionAmount || tx.commissionPaid || 0);
  });

  const sortedMonths = Object.keys(monthlyData).sort().reverse().map(k => monthlyData[k]);

  // Per-School Roster Breakdown
  const schoolPerformance = partner.onboardedSchools.map(school => {
    const schoolLoanVolume = school.transactions.reduce((sum, tx) => sum + (tx.loanAmount || 0), 0);
    const schoolCommission = school.transactions.reduce((sum, tx) => {
      if (tx.partnerId === partner.id) {
        return sum + (tx.commissionAmount || tx.commissionPaid || 0);
      }
      return sum;
    }, 0);

    return {
      id: school.id,
      code: school.code,
      name: school.name,
      location: school.location,
      status: school.status,
      agreementStarts: new Date(school.agreementStarts).toLocaleDateString('en-IN'),
      studentCount: school.students.length,
      loanVolume: schoolLoanVolume,
      commission: schoolCommission
    };
  });

  return (
    <div>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "2rem", flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-info" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              PARTNER CODE: {partner.code}
            </span>
            <span className={`badge ${partner.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
              {partner.status}
            </span>
            <span className="badge badge-info" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              Default Commission: {partner.defaultCommission}%
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", margin: 0 }}>
            {partner.name} - Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            Contact: {partner.contactInfo} | Partner Type: {partner.type}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {currentRole === "admin" && allPartners.length > 0 && (
            <PartnerSelector partners={allPartners} currentPartnerId={partner.id} />
          )}
          <PrintButton label="Print Statement" />
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
            <span>Schools Onboarded</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>school</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            {onboardedSchoolsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Active partner institutions
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
            <span>Total Loan Volume</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>trending_up</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            ₹{totalBusinessLoanVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Disbursed loan amount
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
            <span>Total Commission Earned</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>payments</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--primary)' }}>
            ₹{totalCommissionEarned.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Pending: ₹{pendingCommission.toLocaleString('en-IN')} | Paid: ₹{paidCommission.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
            <span>Financed Students</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>groups</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            {totalStudentsFinanced}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Enrolled under onboarded schools
          </div>
        </div>
      </div>

      {/* Onboarded Schools Roster */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Onboarded Schools Roster</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Institutions onboarded and managed by {partner.name}
            </p>
          </div>
          <ExportButton
            filename={`${partner.code}_onboarded_schools`}
            data={schoolPerformance.map(s => ({
              Code: s.code,
              SchoolName: s.name,
              Location: s.location,
              Status: s.status,
              AgreementStart: s.agreementStarts,
              Students: s.studentCount,
              LoanVolume: s.loanVolume,
              CommissionGenerated: s.commission
            }))}
          />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>School Name</th>
                <th>Location</th>
                <th>Status</th>
                <th>Agreement Start</th>
                <th>Enrolled Students</th>
                <th>Disbursed Loan Volume</th>
                <th>Commission Generated</th>
              </tr>
            </thead>
            <tbody>
              {schoolPerformance.map(s => (
                <tr key={s.id}>
                  <td><span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{s.code}</span></td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.location}</td>
                  <td>
                    <span className={`badge ${s.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>{s.agreementStarts}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{s.studentCount}</td>
                  <td style={{ fontWeight: 500 }}>₹{s.loanVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    ₹{s.commission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
              {schoolPerformance.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                    No onboarded schools linked to this partner yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Statement & Performance */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Monthly Commission Statement</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Aggregated monthly breakdown of loan volume and commissions
            </p>
          </div>
          <ExportButton
            filename={`${partner.code}_monthly_statement`}
            data={sortedMonths.map(m => ({
              Month: m.month,
              DisbursedDeals: m.dealCount,
              DisbursedLoanVolume: m.loanVolume,
              CommissionEarned: m.commission
            }))}
          />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Statement Month</th>
                <th>Disbursed Deals</th>
                <th>Disbursed Loan Volume</th>
                <th>Commission Earned</th>
                <th>Payout Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedMonths.map((m) => (
                <tr key={m.month}>
                  <td style={{ fontWeight: 600 }}>{m.month}</td>
                  <td>{m.dealCount} deals</td>
                  <td>₹{m.loanVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td style={{ color: "var(--primary)", fontWeight: "600" }}>
                    ₹{m.commission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                  <td>
                    <span className="badge badge-success">Active</span>
                  </td>
                </tr>
              ))}
              {sortedMonths.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                    No monthly transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Disbursed Transactions Roster */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Transactions Roster</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Itemized list of fee transactions attributed to {partner.name}
            </p>
          </div>
          <ExportButton
            filename={`${partner.code}_recent_transactions`}
            data={directTransactions.map(tx => ({
              Date: new Date(tx.date).toLocaleDateString('en-IN'),
              StudentCode: tx.student?.code || 'N/A',
              StudentName: tx.student?.name || 'N/A',
              School: tx.school?.name || 'N/A',
              LoanAmount: tx.loanAmount || 0,
              CommissionRate: (tx.commissionRate || 0) + '%',
              CommissionAmount: tx.commissionAmount || tx.commissionPaid || 0,
              Status: tx.commissionStatus || 'Pending'
            }))}
          />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Student Code</th>
                <th>Student Name</th>
                <th>School</th>
                <th>Loan Amount</th>
                <th>Commission Rate</th>
                <th>Commission Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {directTransactions.slice(0, 15).map(tx => {
                const comm = tx.commissionAmount || tx.commissionPaid || 0;
                const status = tx.commissionStatus || 'Pending';
                const statusBadge = status === 'Paid' ? 'badge-success' : status === 'Payable' ? 'badge-info' : 'badge-warning';
                
                return (
                  <tr key={tx.id}>
                    <td>{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                    <td><span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{tx.student?.code || 'N/A'}</span></td>
                    <td style={{ fontWeight: 500 }}>{tx.student?.name || 'N/A'}</td>
                    <td>{tx.school?.name || 'N/A'}</td>
                    <td>₹{(tx.loanAmount || 0).toLocaleString('en-IN')}</td>
                    <td>{tx.commissionRate || partner.defaultCommission}%</td>
                    <td style={{ color: "var(--primary)", fontWeight: "600" }}>
                      ₹{comm.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge}`}>{status}</span>
                    </td>
                  </tr>
                );
              })}
              {directTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                    No transactions found for this partner.
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
