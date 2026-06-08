'use client'

import React from 'react';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="btn btn-primary" 
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>picture_as_pdf</span>
      Download PDF / Print
    </button>
  );
}
