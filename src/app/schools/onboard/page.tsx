import { prisma } from "@/lib/prisma";
import { generateSchoolCode } from "@/lib/codeGenerator";
import { redirect } from "next/navigation";

export default async function OnboardSchoolPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: 'asc' }
  });

  const cutoffs = await prisma.financeCutoff.findMany({
    orderBy: [{ tenure: 'asc' }, { advanceEmi: 'asc' }]
  });

  async function submitSchool(formData: FormData) {
    'use server'
    const name = formData.get('name')?.toString();
    const location = formData.get('location')?.toString();
    const partnerId = formData.get('partnerId')?.toString();
    
    if (!name || !location) return;

    // Parse the dynamic discount rates (format: "discount_{tenure}_{advEmi}")
    const discountsToCreate: any[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('discount_') && value) {
        const parts = key.split('_');
        const tenure = parseInt(parts[1], 10);
        const advanceEmi = parseInt(parts[2], 10);
        const rate = parseFloat(value.toString());
        
        if (!isNaN(tenure) && !isNaN(advanceEmi) && !isNaN(rate)) {
          discountsToCreate.push({ tenure, advanceEmi, discountRate: rate });
        }
      }
    }

    const code = await generateSchoolCode(name);

    await prisma.school.create({
      data: {
        code,
        name,
        location,
        onboardingPartnerId: partnerId || null,
        agreementStarts: new Date(),
        status: 'Active',
        discounts: discountsToCreate.length > 0 ? { create: discountsToCreate } : undefined
      }
    });

    redirect('/schools');
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Onboard New School</h1>
        <p style={{ color: "var(--text-secondary)" }}>Enter the school details, attribute their onboarding partner, and map out their negotiated subvention discount rates.</p>
      </div>

      <div className="card">
        <form action={submitSchool} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>School Name</label>
              <input type="text" name="name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>City/Location</label>
              <input type="text" name="location" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Onboarding Partner (Optional)</label>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                If you select a partner, they will automatically earn a revenue share on all transactions from this school.
              </p>
              <select name="partnerId" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="">-- No Partner (Direct Sales) --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Negotiated Discount Rates matrix</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Define the discount percentage the school is offering us for each Loan Tenure + Advance EMI configuration. Leave empty if a config is not supported by this school.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {cutoffs.map(cutoff => (
                <div key={cutoff.id} style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '6px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    {cutoff.tenure} Months | {cutoff.advanceEmi} Adv EMI
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      step="0.1" 
                      name={`discount_${cutoff.tenure}_${cutoff.advanceEmi}`} 
                      placeholder={`e.g. ${cutoff.subvention + 2}`} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} 
                    />
                    <span style={{ color: 'var(--text-muted)' }}>%</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                    Finance Cutoff: {cutoff.subvention}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <a href="/schools" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>Cancel</a>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Complete Onboarding</button>
          </div>
        </form>
      </div>
    </div>
  );
}
