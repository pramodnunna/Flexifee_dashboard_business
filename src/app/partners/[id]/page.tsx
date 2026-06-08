export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ExportButton from "@/components/ExportButton";
import PrintButton from "@/components/PrintButton";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!partner) {
    notFound();
  }

  // Group transactions by month
  const monthlyData: Record<string, {
    monthKey: string;
    monthName: string;
    dealsCount: number;
    feeVolume: number;
    subventionProfit: number;
    commissionEarned: number;
  }> = {};

  for (const tx of partner.transactions) {
    const date = new Date(tx.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        monthKey,
        monthName,
        dealsCount: 0,
        feeVolume: 0,
        subventionProfit: 0,
        commissionEarned: 0
      };
    }

    monthlyData[monthKey].dealsCount += 1;
    monthlyData[monthKey].feeVolume += tx.feeAmount;
    monthlyData[monthKey].subventionProfit += tx.revenueEarned;
    monthlyData[monthKey].commissionEarned += tx.commissionPaid;
  }

  const sortedMonths = Object.keys(monthlyData)
    .sort((a, b) => b.localeCompare(a))
    .map(key => monthlyData[key]);

  const totalAllCommission = partner.transactions.reduce((acc, tx) => acc + tx.commissionPaid, 0);
  const totalAllFeeVolume = partner.transactions.reduce((acc, tx) => acc + tx.feeAmount, 0);

  return (
    <div className="partner-detail-container">
      {/* CSS overrides for print media (PDF export) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .statement-header-print, .print-footer {
          display: none;
        }
        @media print {
          /* Hide all application chrome */
          .sidebar, .top-header, .back-nav-container, .action-buttons-container {
            display: none !important;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 11pt !important;
          }
          .main-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .page-container {
            padding: 0 !important;
            margin: 0 !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-bottom: 1.5rem !important;
          }
          /* Statement Letterhead */
          .statement-header-print {
            display: block !important;
            margin-bottom: 2rem !important;
            border-bottom: 2px solid #111 !important;
            padding-bottom: 1rem !important;
          }
          .statement-header-print h1 {
            font-size: 18pt !important;
            margin: 0 0 0.25rem 0 !important;
            color: #111 !important;
            text-transform: uppercase !important;
            font-weight: 800;
          }
          .statement-header-print p {
            margin: 0 !important;
            color: #555 !important;
            font-size: 9.5pt !important;
          }
          .partner-info-print-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 1.5rem !important;
            margin-bottom: 2rem !important;
            background: #f9f9f9 !important;
            padding: 1.25rem !important;
            border: 1px solid #ddd !important;
            border-radius: 6px !important;
            font-size: 10pt !important;
          }
          .partner-info-print-grid div {
            margin-bottom: 0.5rem;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 1rem !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px 10px !important;
            font-size: 10pt !important;
          }
          th {
            background-color: #f2f2f2 !important;
            color: #000 !important;
            font-weight: 700 !important;
          }
          .print-footer {
            display: block !important;
            position: fixed !important;
            bottom: 0.5in !important;
            left: 0 !important;
            right: 0 !important;
            text-align: center !important;
            font-size: 8pt !important;
            color: #666 !important;
            border-top: 1px solid #ddd !important;
            padding-top: 0.5rem !important;
          }
        }
      `}} />

      {/* Screen only Back Button */}
      <div className="back-nav-container" style={{ marginBottom: "1.5rem" }}>
        <Link href="/partners" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>arrow_back</span>
          Back to Partners
        </Link>
      </div>

      {/* Printable Letterhead Header */}
      <div className="statement-header-print">
        <h1>FlexiFee</h1>
        <p>Partner Earning & Commission Payout Statement</p>
        <p style={{ fontSize: '8pt', color: '#666', marginTop: '4px' }}>Generated on: {new Date().toLocaleDateString('en-IN')}</p>
      </div>

      {/* Partner Profile Summary Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: "700" }}>{partner.name}</h1>
              <span className={`badge ${partner.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                {partner.status}
              </span>
            </div>
            <p style={{ color: "var(--text-secondary)" }}>Partner Code: <strong style={{ fontFamily: 'monospace' }}>{partner.code}</strong> | Type: {partner.type}</p>
          </div>
          
          <div className="action-buttons-container" style={{ display: 'flex', gap: '0.75rem' }}>
            <ExportButton 
              filename={`${partner.name.replace(/\s+/g, '_')}_monthly_statement`}
              data={sortedMonths.map(m => ({
                Month: m.monthName,
                'Deals Closed': m.dealsCount,
                'Fee Volume (GMV)': m.feeVolume,
                'Gross Revenue (Subvention)': m.subventionProfit,
                'Retained Commission': m.commissionEarned
              }))}
            />
            <PrintButton />
          </div>
        </div>

        {/* Printable & Screen Info Grid */}
        <div className="partner-info-print-grid" style={{ marginTop: '1.5rem' }}>
          <div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Contact Info</span>
              <strong style={{ fontSize: '0.9375rem' }}>{partner.contactInfo}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Agreement Revenue Share</span>
              <strong style={{ fontSize: '0.9375rem' }}>{partner.revenueShare}%</strong>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Share Bank Commission?</span>
              <strong style={{ fontSize: '0.9375rem' }}>{partner.shareBankCommission ? "Enabled (includes 1% setup fee commission)" : "Disabled (subvention only)"}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Lifetime Commission Earned</span>
              <strong style={{ fontSize: '0.9375rem', color: 'var(--primary)' }}>{formatCurrency(totalAllCommission)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Earning Statement Table */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Month-wise Statement</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Billing Month</th>
                <th>Deals Closed</th>
                <th>Fee Volume (GMV)</th>
                <th>Gross Subvention Rev.</th>
                <th>Retained Commission</th>
              </tr>
            </thead>
            <tbody>
              {sortedMonths.map((m) => (
                <tr key={m.monthKey}>
                  <td style={{ fontWeight: 600 }}>{m.monthName}</td>
                  <td>{m.dealsCount}</td>
                  <td style={{ fontWeight: 500 }}>{formatCurrency(m.feeVolume)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 500 }}>+{formatCurrency(m.subventionProfit)}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(m.commissionEarned)}</td>
                </tr>
              ))}
              {sortedMonths.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No earnings or transactions recorded for this partner.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Footer */}
      <div className="print-footer">
        <p>This is a computer-generated document. No signature required.</p>
        <p>© {new Date().getFullYear()} FlexiFee Edufintech. All Rights Reserved.</p>
      </div>
    </div>
  );
}
