import { prisma } from "@/lib/prisma";
import { generateStudentCode } from "@/lib/codeGenerator";
import { redirect } from "next/navigation";

export default async function OnboardStudentPage({ searchParams }: { searchParams?: { error?: string } }) {
  const schools = await prisma.school.findMany({
    where: { status: 'Active' },
    orderBy: { name: 'asc' }
  });

  const partners = await prisma.partner.findMany({
    orderBy: { name: 'asc' }
  });

  async function submitStudent(formData: FormData) {
    'use server'
    
    // 1. Gather Inputs
    const name = formData.get('name')?.toString();
    const schoolId = formData.get('schoolId')?.toString();
    const partnerId = formData.get('partnerId')?.toString();
    const annualFee = parseFloat(formData.get('annualFee')?.toString() || '0');
    const loanAmount = parseFloat(formData.get('loanAmount')?.toString() || '0');
    const tenure = parseInt(formData.get('tenure')?.toString() || '0', 10);
    const advanceEmi = parseInt(formData.get('advanceEmi')?.toString() || '0', 10);
    
    if (!name || !schoolId || isNaN(annualFee) || isNaN(loanAmount) || isNaN(tenure) || isNaN(advanceEmi)) {
      redirect('/students/onboard?error=Missing+required+fields');
    }
    
    if (loanAmount > annualFee) {
       redirect('/students/onboard?error=Loan+amount+cannot+exceed+annual+fee');
    }

    // 2. Fetch Database Data for Subvention Engine
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { discounts: true }
    });

    const cutoff = await prisma.financeCutoff.findUnique({
      where: { tenure_advanceEmi: { tenure, advanceEmi } }
    });

    if (!school) {
       redirect('/students/onboard?error=School+not+found');
    }

    if (!cutoff) {
       redirect(`/students/onboard?error=No+Finance+Cutoff+defined+for+${tenure}+months+and+${advanceEmi}+Advance+EMIs`);
    }

    const schoolDiscount = school.discounts.find(d => d.tenure === tenure && d.advanceEmi === advanceEmi);

    if (!schoolDiscount) {
       redirect(`/students/onboard?error=Strict+Mode+Failure:+School+has+not+negotiated+a+discount+rate+for+the+${tenure}M/${advanceEmi}A+EMI+configuration.`);
    }

    // 3. Mathematical Profit Engine
    const flexiProfitPercent = schoolDiscount.discountRate - cutoff.subvention;
    const revenueEarned = (flexiProfitPercent / 100) * annualFee;

    // 4. Commission Attribution Engine Priority
    let finalPartnerId = partnerId || school.onboardingPartnerId;
    let commissionPaid = 0;

    if (finalPartnerId) {
      const partner = await prisma.partner.findUnique({ where: { id: finalPartnerId } });
      if (partner) {
        commissionPaid = (partner.revenueShare / 100) * revenueEarned;
      }
    }

    const bankCommission = annualFee * 0.01;

    // 5. Database Commit
    const studentCode = await generateStudentCode(school.code);

    await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          code: studentCode,
          name,
          schoolId,
          annualFee,
          loanAmount,
          emiTenureMonths: tenure,
          advanceEmi: advanceEmi,
          status: 'Active'
        }
      });

      await tx.transaction.create({
        data: {
          studentId: student.id,
          schoolId: schoolId,
          partnerId: finalPartnerId,
          feeAmount: annualFee,
          discountApplied: schoolDiscount.discountRate,
          revenueEarned,
          commissionPaid,
          bankCommission,
          date: new Date()
        }
      });
    });

    redirect('/students');
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>Onboard Student & Financier</h1>
        <p style={{ color: "var(--text-secondary)" }}>Process a new loan and instantly calculate gross revenue margin based on the school's subvention setup.</p>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        {searchParams?.error && (
          <div style={{ backgroundColor: 'var(--warning-color)', padding: '1rem', borderRadius: '6px', color: '#fff', marginBottom: '1.5rem', fontWeight: 500 }}>
             🚨 Error: {searchParams.error}
          </div>
        )}

        <form action={submitStudent} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Student Name</label>
              <input type="text" name="name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select School</label>
              <select name="schoolId" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="">-- Choose a School --</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
             <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Total Annual Fee Setup</label>
              <input type="number" name="annualFee" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>

             <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Approved Loan Amount</label>
              <input type="number" name="loanAmount" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
             <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>EMI Tenure (Months)</label>
              <select name="tenure" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="6">6 Months</option>
                <option value="8">8 Months</option>
                <option value="10">10 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>

             <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Advance EMIs paid upfront</label>
              <select name="advanceEmi" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="1">1 Advance EMI</option>
                <option value="2">2 Advance EMIs</option>
              </select>
            </div>
             <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                Note: The core subvention engine will verify this exact matrix against the School's active setup and compute the profit mathematically.
             </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
             <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Override Source Partner (Optional)</label>
             <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                If an Independent Agent brought in this specific loan, select them here to override the school's baseline owner. Do NOT select if direct.
             </p>
             <select name="partnerId" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="">-- No Independent Agent --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <a href="/students" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>Cancel</a>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Calculate & Commit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
