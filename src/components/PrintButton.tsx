'use client';

import React from 'react';

export default function PrintButton({ label = "Print Statement / PDF" }: { label?: string }) {
  return (
    <button 
      onClick={() => window.print()} 
      className="btn btn-secondary"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>print</span>
      {label}
    </button>
  );
}
