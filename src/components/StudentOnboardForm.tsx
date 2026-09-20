'use client';

import React, { useState } from 'react';

interface SchoolDiscount {
  id: string;
  tenure: number;
  advanceEmi: number;
  discountRate: number;
}

interface School {
  id: string;
  code: string;
  name: string;
  location: string;
  discounts: SchoolDiscount[];
}

interface Partner {
  id: string;
  name: string;
  type: string;
}

export default function StudentOnboardForm({
  schools,
  partners,
  submitAction,
  error,
}: {
  schools: School[];
  partners: Partner[];
  submitAction: (formData: FormData) => void;
  error?: string;
}) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>('');
  const [fallbackTenure, setFallbackTenure] = useState<string>('6');
  const [fallbackAdvanceEmi, setFallbackAdvanceEmi] = useState<string>('1');

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);
  const adoptedPlans = selectedSchool?.discounts || [];
  const hasCustomPlans = adoptedPlans.length > 0;

  // Selected plan details
  const currentPlan = adoptedPlans.find(p => `${p.tenure}_${p.advanceEmi}` === selectedPlanKey);

  const activeTenure = hasCustomPlans
    ? (currentPlan ? currentPlan.tenure : (adoptedPlans[0]?.tenure || 6))
    : parseInt(fallbackTenure, 10);

  const activeAdvanceEmi = hasCustomPlans
    ? (currentPlan ? currentPlan.advanceEmi : (adoptedPlans[0]?.advanceEmi || 1))
    : parseInt(fallbackAdvanceEmi, 10);

  const activeDiscountRate = hasCustomPlans
    ? (currentPlan ? currentPlan.discountRate : (adoptedPlans[0]?.discountRate || 0))
    : null;

  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSchoolId(id);
    const schoolObj = schools.find(s => s.id === id);
    if (schoolObj && schoolObj.discounts.length > 0) {
      setSelectedPlanKey(`${schoolObj.discounts[0].tenure}_${schoolObj.discounts[0].advanceEmi}`);
    } else {
      setSelectedPlanKey('');
    }
  };

  return (
    <form action={submitAction} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {error && (
        <div style={{ backgroundColor: 'var(--destructive)', padding: '1rem', borderRadius: '6px', color: '#fff', fontWeight: 500 }}>
          🚨 Error: {error}
        </div>
      )}

      {/* Hidden inputs to pass computed tenure & advance EMI to server action */}
      <input type="hidden" name="tenure" value={activeTenure} />
      <input type="hidden" name="advanceEmi" value={activeAdvanceEmi} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Student Name <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Rahul Sharma"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Select School <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            name="schoolId"
            value={selectedSchoolId}
            onChange={handleSchoolChange}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
          >
            <option value="">-- Choose a School --</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.location})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Total Annual Fee Setup (₹) <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="number"
            name="annualFee"
            required
            placeholder="e.g. 120000"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Approved Loan Amount (₹) <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="number"
            name="loanAmount"
            required
            placeholder="e.g. 100000"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
          />
        </div>
      </div>

      {/* Dynamically Adopted School Subvention Plans */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Payment Plan / Subvention Structure <span style={{ color: 'red' }}>*</span>
          </label>
          {selectedSchool && (
            <span className={`badge ${hasCustomPlans ? 'badge-success' : 'badge-warning'}`}>
              {hasCustomPlans
                ? `✓ ${adoptedPlans.length} Adopted Plan(s) for ${selectedSchool.name}`
                : `Showing Default Plans (No Custom Matrix)`}
            </span>
          )}
        </div>

        {!selectedSchoolId ? (
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            ℹ️ Please select a school above to view its adopted subvention plans.
          </div>
        ) : hasCustomPlans ? (
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Only plans specifically negotiated and adopted by <strong>{selectedSchool?.name}</strong> are displayed below:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {adoptedPlans.map(plan => {
                const planKey = `${plan.tenure}_${plan.advanceEmi}`;
                const isSelected = planKey === (selectedPlanKey || `${adoptedPlans[0].tenure}_${adoptedPlans[0].advanceEmi}`);

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanKey(planKey)}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'var(--primary-light, #f0f7ff)' : 'var(--bg-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {plan.tenure} Months Tenure
                      </span>
                      {isSelected && (
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>
                          check_circle
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Advance EMIs: <strong>{plan.advanceEmi} Upfront</strong>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
                      School Discount Rate: {plan.discountRate}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {selectedSchool?.name} has not set up a custom discount matrix. Choose from standard finance cutoffs:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>EMI Tenure (Months)</label>
                <select
                  value={fallbackTenure}
                  onChange={e => setFallbackTenure(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                >
                  <option value="6">6 Months</option>
                  <option value="8">8 Months</option>
                  <option value="10">10 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Advance EMIs Upfront</label>
                <select
                  value={fallbackAdvanceEmi}
                  onChange={e => setFallbackAdvanceEmi(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                >
                  <option value="1">1 Advance EMI</option>
                  <option value="2">2 Advance EMIs</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Partner Attribution */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Override Source Partner (Optional)
        </label>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          If an Independent Agent brought in this specific student loan, select them here to override the school default partner.
        </p>
        <select name="partnerId" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <option value="">-- Default (Use School Onboarding Partner / Direct) --</option>
          {partners.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.type})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <a href="/students" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>
          Cancel
        </a>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          Calculate & Commit Loan
        </button>
      </div>
    </form>
  );
}
