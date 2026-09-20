export const dynamic = 'force-dynamic';

import React from 'react';
import { prisma } from "@/lib/prisma";
import { updateSchool } from "@/app/schools/editActions";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      discounts: true,
      onboardingPartner: true,
    },
  });

  if (!school) {
    notFound();
  }

  const partners = await prisma.partner.findMany({
    where: { status: 'Active' },
    orderBy: { name: 'asc' },
  });

  const cutoffs = await prisma.financeCutoff.findMany({
    orderBy: [{ tenure: 'asc' }, { advanceEmi: 'asc' }],
  });

  // Create a quick map of existing discounts for fast lookup: `${tenure}_${advanceEmi}` -> discountRate
  const discountMap: Record<string, number> = {};
  school.discounts.forEach(d => {
    discountMap[`${d.tenure}_${d.advanceEmi}`] = d.discountRate;
  });

  return (
    <div>
      <div style={{ marginBottom: "2rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>
              {school.code}
            </span>
            <span className={`badge ${school.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
              {school.status}
            </span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.25rem" }}>
            Edit School: {school.name}
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Update institution profile, status, assigned partner, and negotiated subvention discounts.
          </p>
        </div>
        <Link href="/schools" className="btn btn-secondary">
          &larr; Back to Schools
        </Link>
      </div>

      <div className="card">
        <form action={updateSchool} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <input type="hidden" name="schoolId" value={school.id} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                School Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={school.name}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                City / Location
              </label>
              <input
                type="text"
                name="location"
                defaultValue={school.location}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Account Status
              </label>
              <select
                name="status"
                defaultValue={school.status}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
              >
                <option value="Active">Active</option>
                <option value="Pipeline">Pipeline</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Onboarding Partner
              </label>
              <select
                name="partnerId"
                defaultValue={school.onboardingPartnerId || ''}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
              >
                <option value="">-- No Partner (Direct Sales) --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Negotiated Subvention Discount Rates Matrix
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Specify the subvention discount rate (%) offered by this school for each tenure & advance EMI combination. Clear input to disable plan.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {cutoffs.map(cutoff => {
                const existingRate = discountMap[`${cutoff.tenure}_${cutoff.advanceEmi}`];
                return (
                  <div key={cutoff.id} style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {cutoff.tenure} Months | {cutoff.advanceEmi} Adv EMI
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        step="0.1"
                        name={`discount_${cutoff.tenure}_${cutoff.advanceEmi}`}
                        defaultValue={existingRate !== undefined ? existingRate : ''}
                        placeholder={`Baseline cutoff: ${cutoff.subvention}%`}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>%</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                      Baseline Finance Cutoff: {cutoff.subvention}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link href="/schools" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
