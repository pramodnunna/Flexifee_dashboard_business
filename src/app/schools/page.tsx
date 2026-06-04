export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import ExportButton from "@/components/ExportButton";
import { cookies } from "next/headers";
import { deboardSchool } from "../actions/deboard";

export default async function SchoolsPage() {
  const cookieStore = await cookies();
  const isAdmin = (cookieStore.get("role")?.value || "admin") === "admin";

  const schools = await prisma.school.findMany({
    include: {
      _count: {
        select: { students: true }
      },
      transactions: {
        select: { feeAmount: true, revenueEarned: true }
      },
      discounts: true,
      onboardingPartner: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Schools Management</h1>
          <p style={{ color: "var(--text-secondary)" }}>Manage onboarded schools and their performance.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "2rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="card-title">Add New School</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: '0.25rem' }}>Full onboarding flow mapping discounts and partners.</p>
        </div>
        <a href="/schools/onboard" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>Onboard School</a>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">School Roster</h2>
          <ExportButton 
            filename="schools_roster"
            data={schools.map(s => ({
              ID: s.id,
              Name: s.name,
              Location: s.location,
              StudentsCount: s._count.students,
              Discounts: s.discounts.map(d => `${d.tenure}M/${d.advanceEmi}Adv: ${d.discountRate}%`).join(' | '),
              Status: s.status
            }))}
          />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Location</th>
                <th>Students Enrolled</th>
                <th>Discount Options</th>
                <th>Onboarding Partner</th>
                <th>Revenue Generated</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {schools.map(school => {
                const totalRevenue = school.transactions.reduce((acc, sum) => acc + sum.revenueEarned, 0);
                
                return (
                  <tr key={school.id} style={school.status === 'Inactive' ? { opacity: 0.6 } : undefined}>
                    <td><span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{school.code}</span></td>
                    <td style={{ fontWeight: 500 }}>{school.name}</td>
                    <td>{school.location}</td>
                    <td>{school._count.students}</td>
                    <td>
                      {school.discounts.map(d => (
                         <div key={d.id} style={{ fontSize: '0.75rem', color: "var(--text-secondary)" }}>
                           {d.tenure}M/Adv{d.advanceEmi}: <strong style={{ color: "var(--text-primary)" }}>{d.discountRate}%</strong>
                         </div>
                      ))}
                      {school.discounts.length === 0 && <span style={{ color: "var(--text-muted)" }}>None Setup</span>}
                    </td>
                    <td>
                      {school.onboardingPartner
                        ? <span className="badge badge-info">{school.onboardingPartner.name}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>Direct Sales</span>
                      }
                    </td>
                    <td>₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td>
                      <span className={`badge ${school.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                        {school.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        {school.status === 'Active' ? (
                          <form action={deboardSchool}>
                            <input type="hidden" name="id" value={school.id} />
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
