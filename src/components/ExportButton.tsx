'use client'

import React from 'react';

export default function ExportButton({ data, filename }: { data: any[], filename: string }) {
  const handleExport = () => {
    if (data.length === 0) return;

    // Get headers
    const headers = Object.keys(data[0]);

    // Format rows
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let cell = row[header] === null || row[header] === undefined ? '' : row[header];
          // Wrap in quotes if it contains commas
          if (typeof cell === 'string' && cell.includes(',')) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={handleExport} className="btn btn-secondary">
      Export CSV
    </button>
  );
}
