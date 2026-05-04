import { prisma } from "@/lib/prisma";
import ExportButton from "@/components/ExportButton";

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({
    include: {
      transactions: {
        select: { feeAmount: true, commissionPaid: true, revenueEarned: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate Leaderboard metrics
  const partnersWithMetrics = partners.map(partner => {
    const totalCommission = partner.transactions.reduce((acc, tx) => acc + tx.commissionPaid, 0);
    const totalTransactions = partner.transactions.length;
    const revenueContribution = partner.transactions.reduce((acc, tx) => acc + tx.revenueEarned, 0);

    return {
      ...partner,
      totalCommission,
      totalTransactions,
      revenueContribution
    };
  }).sort((a, b) => b.totalCommission - a.totalCommission);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Partners Management & Leaderboard</h1>
          <p style={{ color: "var(--text-secondary)" }}>Track partner performance and commission payouts.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "2rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="card-title">Add New Partner</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: '0.25rem' }}>Full onboarding flow setting up partner type and revenue share.</p>
        </div>
        <a href="/partners/onboard" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>Onboard Partner</a>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Top Performing Partners</h2>
          <ExportButton 
            filename="partners_leaderboard"
            data={partnersWithMetrics.map((p, index) => ({
              Rank: index + 1,
              Name: p.name,
              Type: p.type,
              RevShare: p.revenueShare + '%',
              DealsClosed: p.totalTransactions,
              RevenueContributed: p.revenueContribution,
              CommissionEarned: p.totalCommission
            }))}
          />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Code</th>
                <th>Partner Name</th>
                <th>Type</th>
                <th>Rev Share</th>
                <th>Deals Closed</th>
                <th>Revenue Contributed</th>
                <th>Commission Earned</th>
              </tr>
            </thead>
            <tbody>
              {partnersWithMetrics.map((partner, index) => (
                <tr key={partner.id}>
                  <td>
                    {index === 0 && <span style={{ fontSize: '1.25rem' }}>🥇 </span>}
                    {index === 1 && <span style={{ fontSize: '1.25rem' }}>🥈 </span>}
                    {index === 2 && <span style={{ fontSize: '1.25rem' }}>🥉 </span>}
                    {index > 2 && `#${index + 1}`}
                  </td>
                  <td><span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{partner.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{partner.name}</td>
                  <td>
                    <span className="badge badge-info">{partner.type}</span>
                  </td>
                  <td>{partner.revenueShare}%</td>
                  <td>{partner.totalTransactions}</td>
                  <td>₹{partner.revenueContribution.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td style={{ color: "var(--primary)", fontWeight: "600" }}>₹{partner.totalCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
              {partnersWithMetrics.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>No partners found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
