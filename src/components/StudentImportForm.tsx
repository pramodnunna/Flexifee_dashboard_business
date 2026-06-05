'use client'

import { useActionState, useRef, useState } from "react";
import { importStudents } from "../app/actions/import";

export default function StudentImportForm() {
  const [state, formAction, isPending] = useActionState(importStudents, null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Instructions Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        fontSize: '0.875rem'
      }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary)' }}>Excel / CSV Import Instructions</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Please upload a spreadsheet with the following exact columns. The order of columns does not matter, and names are case-insensitive.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Student Name</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Full name of student</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>School Code</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>e.g. DPS001, SCH002</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Annual Fee</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total fee amount in INR</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Loan Amount</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Approved loan (≤ Annual Fee)</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Tenure</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>6, 8, 10, or 12 months</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Advance EMI</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>1 or 2 upfront EMIs</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', gridColumn: '1 / -1' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Partner Code (Optional Override)</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Specify to override the school's onboarding partner. If left blank, the system will **automatically attribute** the transaction to the school's sales partner.
            </div>
          </div>
        </div>
      </div>

      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Drag and Drop Zone */}
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '12px',
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.02)',
            transition: 'all 0.2s ease-in-out',
            borderColor: selectedFile ? 'var(--primary)' : 'var(--border-color)'
          }}
          className="import-dropzone"
        >
          <input 
            type="file" 
            name="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx,.xls,.csv" 
            style={{ display: 'none' }} 
          />
          
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            {selectedFile ? '📄' : '📤'}
          </div>

          {selectedFile ? (
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  background: 'var(--destructive)',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Remove File
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Drag & Drop file here, or click to browse
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)
              </div>
            </div>
          )}
        </div>

        {/* Feedback Messages */}
        {state && state.success === false && state.errors && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--destructive)',
            borderRadius: '8px',
            padding: '1rem 1.5rem',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <h4 style={{ color: 'var(--destructive)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Import Failed ({state.errors.length} validation errors)
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {state.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {state && state.success === true && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--secondary)',
            borderRadius: '8px',
            padding: '1rem 1.5rem'
          }}>
            <h4 style={{ color: 'var(--secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Import Successful!
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Successfully onboarded {state.count} students and recorded their financial ledger transactions.
            </p>
          </div>
        )}

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <a href="/students" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>Cancel</a>
          <button 
            type="submit" 
            disabled={isPending} 
            className="btn btn-primary" 
            style={{ 
              padding: '0.75rem 2rem',
              opacity: isPending ? 0.6 : 1,
              cursor: isPending ? 'not-allowed' : 'pointer'
            }}
          >
            {isPending ? "Processing..." : "Upload & Onboard"}
          </button>
        </div>
      </form>
    </div>
  );
}
