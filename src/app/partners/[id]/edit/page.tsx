import { prisma } from "@/lib/prisma";
import { editPartner } from "./actions";
import { notFound } from "next/navigation";

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id }
  });

  if (!partner) {
    notFound();
  }

  const editPartnerWithId = editPartner.bind(null, id);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Edit Partner Details</h1>
        <p style={{ color: "var(--text-secondary)" }}>Update partner configuration, contact details, or revenue sharing settings.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form action={editPartnerWithId} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Partner/Agent Name</label>
            <input 
              type="text" 
              name="name" 
              defaultValue={partner.name} 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Entity Type</label>
            <select 
              name="type" 
              defaultValue={partner.type} 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
            >
              <option value="Individual">Individual (Freelancer/Agent)</option>
              <option value="Organization">Organization (Consultancy)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contact Email/Phone</label>
            <input 
              type="text" 
              name="contactInfo" 
              defaultValue={partner.contactInfo} 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Revenue Share Percentage</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              What percentage of FlexiFee's total profit should this partner earn on every completed transaction?
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="number" 
                step="0.1" 
                name="revenueShare" 
                defaultValue={partner.revenueShare} 
                required 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
              />
              <span style={{ color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
              <input 
                type="checkbox" 
                name="shareBankCommission" 
                defaultChecked={partner.shareBankCommission} 
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} 
              />
              <span>Share Bank Commission?</span>
            </label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginLeft: '2rem' }}>
              If enabled, this partner will earn their revenue share percentage on the bank commission as well as the subvention profit.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <a href="/partners" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>Cancel</a>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
