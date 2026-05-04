import { prisma } from "@/lib/prisma";
import { generatePartnerCode } from "@/lib/codeGenerator";
import { redirect } from "next/navigation";

export default async function OnboardPartnerPage() {
  async function submitPartner(formData: FormData) {
    'use server'
    const name = formData.get('name')?.toString();
    const type = formData.get('type')?.toString();
    const contactInfo = formData.get('contactInfo')?.toString();
    const revenueShare = parseFloat(formData.get('revenueShare')?.toString() || '0');
    
    if (!name || !type || !contactInfo || isNaN(revenueShare)) return;

    const code = await generatePartnerCode(name);

    await prisma.partner.create({
      data: {
        code,
        name,
        type,
        contactInfo,
        revenueShare
      }
    });

    redirect('/partners');
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Onboard New Partner</h1>
        <p style={{ color: "var(--text-secondary)" }}>Add a new partner, agent, or institution to track their performance and revenue sharing.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form action={submitPartner} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Partner/Agent Name</label>
            <input type="text" name="name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Entity Type</label>
            <select name="type" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <option value="Individual">Individual (Freelancer/Agent)</option>
              <option value="Organization">Organization (Consultancy)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contact Email/Phone</label>
            <input type="text" name="contactInfo" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Revenue Share Percentage</label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              What percentage of FlexiFee's total profit should this partner earn on every completed transaction?
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="number" step="0.1" name="revenueShare" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
              <span style={{ color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <a href="/partners" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>Cancel</a>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Onboard Partner</button>
          </div>
        </form>
      </div>
    </div>
  );
}
