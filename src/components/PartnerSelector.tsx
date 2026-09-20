'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PartnerSelector({ partners, currentPartnerId }: { partners: { id: string; name: string; code: string }[]; currentPartnerId: string }) {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>View Partner:</label>
      <select
        value={currentPartnerId}
        onChange={(e) => {
          router.push(`/partner-dashboard?partnerId=${e.target.value}`);
        }}
        className="form-control"
        style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
      >
        {partners.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.code})
          </option>
        ))}
      </select>
    </div>
  );
}
