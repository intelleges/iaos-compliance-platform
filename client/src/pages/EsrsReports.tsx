// @ts-nocheck
/**
 * eSRS (Electronic Subcontracting Reporting System) Dashboard
 * Federal compliance reporting for subcontractor diversity tracking
 */

import React, { useState } from 'react';
import { BarChart3, Download, FileText, AlertTriangle, X } from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface EsrsColumn {
  id: string;
  label: string;
  fullName: string;
  color: string | null;
  bg: string | null;
}

interface PartnerType {
  name: string;
  L: number;
  S: number;
  SDB: number;
  WOSB: number;
  VOSB: number;
  DVOSB: number;
  T: number;
}

interface EsrsGroup {
  id: string;
  name: string;
  completionPercent: number;
  needsAttention?: boolean;
  partnerTypes: PartnerType[];
}

interface ZCodePartner {
  internalId: string;
  name: string;
  L: number;
  S: number;
  SDB: number;
  WOSB: number;
  VOSB: number;
  DVOSB: number;
}

// ============================================
// COLUMN DEFINITIONS
// ============================================

const esrsColumns: EsrsColumn[] = [
  { id: 'L', label: 'L', fullName: 'Large', color: null, bg: null },
  { id: 'S', label: 'S', fullName: 'Small', color: null, bg: null },
  { id: 'SDB', label: 'SDB', fullName: 'Small Disadvantaged', color: '#DC2626', bg: '#FEE2E2' },
  { id: 'WOSB', label: 'WOSB', fullName: 'Woman-Owned', color: '#D97706', bg: '#FEF3C7' },
  { id: 'VOSB', label: 'VOSB', fullName: 'Veteran-Owned', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'DVOSB', label: 'DVOSB', fullName: 'Disabled Veteran', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'T', label: 'T', fullName: 'Total', color: null, bg: null },
];

// ============================================
// MOCK DATA - Replace with tRPC queries
// ============================================

const esrsGroups: EsrsGroup[] = [
  { id: 'cme', name: 'CME', completionPercent: 56, partnerTypes: [{ name: 'Supplier', L: 45, S: 89, SDB: 29, WOSB: 23, VOSB: 18, DVOSB: 12, T: 216 }] },
  { id: 'cmo', name: 'CMO', completionPercent: 61, partnerTypes: [{ name: 'Supplier', L: 55, S: 97, SDB: 23, WOSB: 19, VOSB: 14, DVOSB: 11, T: 219 }] },
  { id: 'cmy', name: 'CMY', completionPercent: 70, partnerTypes: [{ name: 'Supplier', L: 317, S: 412, SDB: 91, WOSB: 67, VOSB: 52, DVOSB: 38, T: 977 }] },
  { id: 'cno', name: 'CNO', completionPercent: 62, partnerTypes: [{ name: 'Supplier', L: 125, S: 198, SDB: 53, WOSB: 41, VOSB: 32, DVOSB: 24, T: 473 }] },
  { id: 'cov', name: 'COV', completionPercent: 61, partnerTypes: [{ name: 'Supplier', L: 67, S: 134, SDB: 23, WOSB: 18, VOSB: 14, DVOSB: 10, T: 266 }] },
  { id: 'csp', name: 'CSP', completionPercent: 72, partnerTypes: [{ name: 'Supplier', L: 149, S: 245, SDB: 45, WOSB: 34, VOSB: 27, DVOSB: 19, T: 519 }] },
  { id: 'new_hope', name: 'NEW_HOPE', completionPercent: 76, partnerTypes: [{ name: 'Supplier', L: 144, S: 189, SDB: 18, WOSB: 14, VOSB: 11, DVOSB: 8, T: 384 }] },
  { id: 'rochester', name: 'ROCHESTER', completionPercent: 53, needsAttention: true, partnerTypes: [{ name: 'Supplier', L: 1, S: 12, SDB: 2, WOSB: 1, VOSB: 1, DVOSB: 0, T: 17 }] },
];

const zCodePartnerData: ZCodePartner[] = [
  { internalId: 'SUP-001', name: 'Acme Corporation', L: 0, S: 1, SDB: 0, WOSB: 1, VOSB: 1, DVOSB: 0 },
  { internalId: 'SUP-002', name: 'TechParts Industries', L: 0, S: 1, SDB: 1, WOSB: 0, VOSB: 0, DVOSB: 0 },
  { internalId: 'SUP-003', name: 'Global Supply Solutions', L: 1, S: 0, SDB: 0, WOSB: 0, VOSB: 0, DVOSB: 0 },
  { internalId: 'SUP-004', name: 'Veteran Logistics LLC', L: 0, S: 1, SDB: 0, WOSB: 0, VOSB: 1, DVOSB: 1 },
  { internalId: 'SUP-005', name: 'WomenFirst Manufacturing', L: 0, S: 1, SDB: 1, WOSB: 1, VOSB: 0, DVOSB: 0 },
  { internalId: 'SUP-006', name: 'Precision Aerospace Inc', L: 1, S: 0, SDB: 0, WOSB: 0, VOSB: 0, DVOSB: 0 },
  { internalId: 'SUP-007', name: 'Minority Tech Solutions', L: 0, S: 1, SDB: 1, WOSB: 0, VOSB: 0, DVOSB: 0 },
  { internalId: 'SUP-008', name: 'Heritage Defense Group', L: 0, S: 1, SDB: 0, WOSB: 0, VOSB: 1, DVOSB: 0 },
  { internalId: 'SUP-009', name: 'Diversified Components', L: 0, S: 1, SDB: 1, WOSB: 1, VOSB: 1, DVOSB: 0 },
  { internalId: 'SUP-010', name: 'National Parts Corp', L: 1, S: 0, SDB: 0, WOSB: 0, VOSB: 0, DVOSB: 0 },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const calculateZCode = (partner: ZCodePartner) => {
  const binary = `${partner.L}${partner.S}${partner.SDB}${partner.WOSB}${partner.VOSB}${partner.DVOSB}`;
  const decimal = parseInt(binary, 2);
  return { binary, decimal };
};

const getEsrsGroupTotals = (group: EsrsGroup) => {
  const totals: any = { L: 0, S: 0, SDB: 0, WOSB: 0, VOSB: 0, DVOSB: 0, T: 0 };
  group.partnerTypes.forEach(pt => {
    esrsColumns.forEach(col => {
      totals[col.id] += (pt as any)[col.id] || 0;
    });
  });
  return totals;
};

const getEsrsEnterpriseTotals = () => {
  const totals: any = { L: 0, S: 0, SDB: 0, WOSB: 0, VOSB: 0, DVOSB: 0, T: 0 };
  esrsGroups.forEach(group => {
    const groupTotals = getEsrsGroupTotals(group);
    esrsColumns.forEach(col => {
      totals[col.id] += groupTotals[col.id];
    });
  });
  return totals;
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function EsrsReports() {
  const [selectedEsrsPeriod, setSelectedEsrsPeriod] = useState('fy2025-q1');
  const [showZCodeExport, setShowZCodeExport] = useState(false);

  const exportZCodeCSV = () => {
    const headers = ['internal_id', 'zcode_decimal', 'zcode_binary', 'L', 'S', 'SDB', 'WOSB', 'VOSB', 'DVOSB'];
    const rows = zCodePartnerData.map(partner => {
      const zCode = calculateZCode(partner);
      return [partner.internalId, zCode.decimal, zCode.binary, partner.L, partner.S, partner.SDB, partner.WOSB, partner.VOSB, partner.DVOSB].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zcode_export_${selectedEsrsPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportZCodeExcel = () => {
    const zCodeRows = zCodePartnerData.map(partner => {
      const zCode = calculateZCode(partner);
      return { ...partner, zcode_binary: zCode.binary, zcode_decimal: zCode.decimal };
    });

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; }
          th { background-color: #111117; color: white; font-weight: bold; padding: 8px; text-align: center; }
          td { border: 1px solid #ddd; padding: 6px; text-align: center; }
          .sdb { background-color: #FEE2E2; color: #DC2626; }
          .wosb { background-color: #FEF3C7; color: #D97706; }
          .vosb, .dvosb { background-color: #DBEAFE; color: #2563EB; }
          .zcode { background-color: #F3F4F6; font-family: monospace; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>eSRS Z-Code Export Report</h2>
        <p>Report Period: ${selectedEsrsPeriod.toUpperCase()}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th>Internal ID</th>
              <th style="background-color:#1F2937">Z-Code (Decimal)</th>
              <th style="background-color:#1F2937">Z-Code (Binary)</th>
              <th>L</th><th>S</th>
              <th style="background-color:#DC2626">SDB</th>
              <th style="background-color:#D97706">WOSB</th>
              <th style="background-color:#2563EB">VOSB</th>
              <th style="background-color:#2563EB">DVOSB</th>
            </tr>
          </thead>
          <tbody>
            ${zCodeRows.map(row => `
              <tr>
                <td style="text-align:left; color:#2563EB; font-family:monospace;">${row.internalId}</td>
                <td class="zcode">${row.zcode_decimal}</td>
                <td class="zcode">${row.zcode_binary}</td>
                <td>${row.L}</td><td>${row.S}</td>
                <td class="${row.SDB ? 'sdb' : ''}">${row.SDB}</td>
                <td class="${row.WOSB ? 'wosb' : ''}">${row.WOSB}</td>
                <td class="${row.VOSB ? 'vosb' : ''}">${row.VOSB}</td>
                <td class="${row.DVOSB ? 'dvosb' : ''}">${row.DVOSB}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <br/>
        <h3>Z-Code Legend</h3>
        <table>
          <tr><th>Bit</th><th>Code</th><th>Category</th><th>Decimal Value</th></tr>
          <tr><td>0</td><td>L</td><td>Large Business</td><td>32</td></tr>
          <tr><td>1</td><td>S</td><td>Small Business</td><td>16</td></tr>
          <tr><td>2</td><td>SDB</td><td>Small Disadvantaged Business</td><td>8</td></tr>
          <tr><td>3</td><td>WOSB</td><td>Woman-Owned Small Business</td><td>4</td></tr>
          <tr><td>4</td><td>VOSB</td><td>Veteran-Owned Small Business</td><td>2</td></tr>
          <tr><td>5</td><td>DVOSB</td><td>Disabled Veteran-Owned SB</td><td>1</td></tr>
        </table>
        <br/>
        <h3>Summary</h3>
        <table>
          <tr><th>Category</th><th>Count</th><th>Percentage</th></tr>
          ${['L', 'S', 'SDB', 'WOSB', 'VOSB', 'DVOSB'].map(cat => {
            const count = zCodeRows.filter(r => (r as any)[cat]).length;
            return `<tr><td>${cat}</td><td>${count}</td><td>${((count / zCodeRows.length) * 100).toFixed(1)}%</td></tr>`;
          }).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zcode_export_${selectedEsrsPeriod}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const enterpriseTotals = getEsrsEnterpriseTotals();
  const smallBizTotal = enterpriseTotals.S + enterpriseTotals.SDB + enterpriseTotals.WOSB + enterpriseTotals.VOSB + enterpriseTotals.DVOSB;
  const overallPercent = enterpriseTotals.T > 0 ? Math.round((smallBizTotal / enterpriseTotals.T) * 100) : 0;

  return (
    <div className="p-6">
      {/* Z-Code Export Modal */}
      {showZCodeExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Z-Code Export Report</h2>
                <p className="text-sm text-gray-500">Socioeconomic classification codes from Annual Reps & Certs</p>
              </div>
              <button onClick={() => setShowZCodeExport(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-auto flex-1">
              {/* Z-Code Bit Legend */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Z-Code Bit Positions (L→DVOSB)</h3>
                <div className="grid grid-cols-6 gap-2 text-xs">
                  {[
                    { bit: 0, code: 'L', name: 'Large', color: null },
                    { bit: 1, code: 'S', name: 'Small', color: null },
                    { bit: 2, code: 'SDB', name: 'Disadvantaged', color: 'red' },
                    { bit: 3, code: 'WOSB', name: 'Woman-Owned', color: 'yellow' },
                    { bit: 4, code: 'VOSB', name: 'Veteran', color: 'blue' },
                    { bit: 5, code: 'DVOSB', name: 'Disabled Vet', color: 'blue' },
                  ].map(item => (
                    <div key={item.bit} className="text-center p-2 bg-white rounded border">
                      <div className="font-bold">Bit {item.bit}</div>
                      <div>{item.code}</div>
                      <div className="text-gray-400">{item.name}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-sm text-blue-800">
                  <strong>Example:</strong> 010110 = Small (1) + WOSB (1) + VOSB (1) = Decimal 22
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="text-left px-4 py-3">Internal ID</th>
                      <th className="text-center px-4 py-3 bg-gray-900">Decimal</th>
                      <th className="text-center px-4 py-3 bg-gray-900">Binary</th>
                      <th className="text-center px-2 py-3">L</th>
                      <th className="text-center px-2 py-3">S</th>
                      <th className="text-center px-2 py-3 text-red-300">SDB</th>
                      <th className="text-center px-2 py-3 text-yellow-300">WOSB</th>
                      <th className="text-center px-2 py-3 text-blue-300">VOSB</th>
                      <th className="text-center px-2 py-3 text-blue-300">DVOSB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zCodePartnerData.map((partner, idx) => {
                      const zCode = calculateZCode(partner);
                      return (
                        <tr key={partner.internalId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 font-mono text-blue-600">{partner.internalId}</td>
                          <td className="text-center px-4 py-2 font-mono font-bold bg-gray-100">{zCode.decimal}</td>
                          <td className="text-center px-4 py-2 font-mono font-bold bg-gray-100">{zCode.binary}</td>
                          <td className="text-center px-2 py-2">{partner.L}</td>
                          <td className="text-center px-2 py-2">{partner.S}</td>
                          <td className="text-center px-2 py-2" style={{ backgroundColor: partner.SDB ? '#FEE2E2' : '', color: partner.SDB ? '#DC2626' : '#9CA3AF' }}>{partner.SDB}</td>
                          <td className="text-center px-2 py-2" style={{ backgroundColor: partner.WOSB ? '#FEF3C7' : '', color: partner.WOSB ? '#D97706' : '#9CA3AF' }}>{partner.WOSB}</td>
                          <td className="text-center px-2 py-2" style={{ backgroundColor: partner.VOSB ? '#DBEAFE' : '', color: partner.VOSB ? '#2563EB' : '#9CA3AF' }}>{partner.VOSB}</td>
                          <td className="text-center px-2 py-2" style={{ backgroundColor: partner.DVOSB ? '#DBEAFE' : '', color: partner.DVOSB ? '#2563EB' : '#9CA3AF' }}>{partner.DVOSB}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-500">{zCodePartnerData.length} partners with completed questionnaires</div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowZCodeExport(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
                <button onClick={exportZCodeCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={exportZCodeExcel} className="px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2" style={{ backgroundColor: '#2496F4' }}>
                  <Download className="w-4 h-4" /> Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">eSRS Subcontracting Report</h3>
            <p className="text-sm text-gray-500">Electronic Subcontracting Reporting System - Socioeconomic Category Tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={selectedEsrsPeriod} 
              onChange={(e) => setSelectedEsrsPeriod(e.target.value)} 
              className="text-sm border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="fy2025-q1">FY2025 Q1</option>
              <option value="fy2025-q2">FY2025 Q2</option>
              <option value="fy2024-annual">FY2024 Annual</option>
            </select>
            <button 
              onClick={() => setShowZCodeExport(true)} 
              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Z-Code Report
            </button>
            <button 
              onClick={exportZCodeExcel} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Quick Export
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 font-medium">Small Business Participation</div>
              <div className="text-3xl font-bold text-blue-900">{overallPercent}%</div>
              <div className="text-xs text-blue-600 mt-1">{smallBizTotal} of {enterpriseTotals.T} total subcontractors</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Report Period</div>
              <div className="text-lg font-semibold text-gray-900">{selectedEsrsPeriod.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {esrsGroups.map(group => {
            const totals = getEsrsGroupTotals(group);
            return (
              <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="text-white px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#111117' }}>
                  <span className="font-semibold">{group.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${group.completionPercent >= 70 ? 'bg-green-500' : group.completionPercent >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    {group.completionPercent}%
                  </span>
                </div>
                {group.needsAttention && (
                  <div className="bg-red-50 border-b border-red-200 px-4 py-1.5 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">NEEDS ATTENTION - Lowest Completion</span>
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">TYPE</th>
                      {esrsColumns.map(col => (
                        <th key={col.id} className="text-center px-2 py-2 font-medium text-xs" style={{ color: col.color || '#4B5563' }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.partnerTypes.map((pt, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-700">{pt.name}</td>
                        {esrsColumns.map(col => (
                          <td 
                            key={col.id} 
                            className="text-center px-2 py-2 font-medium" 
                            style={{ backgroundColor: col.bg || '', color: col.color || '#111827' }}
                          >
                            {(pt as any)[col.id]}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-3 py-2 text-gray-700">Total</td>
                      {esrsColumns.map(col => (
                        <td 
                          key={col.id} 
                          className="text-center px-2 py-2 font-bold" 
                          style={{ backgroundColor: col.bg || '', color: col.color || '#111827' }}
                        >
                          {totals[col.id]}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Enterprise Totals */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
            <span className="text-lg font-bold">ENTERPRISE TOTALS (8 Groups)</span>
            <span className="text-2xl font-bold">{overallPercent}% Complete</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="text-left px-6 py-3 font-semibold text-gray-700">CATEGORY</th>
                {esrsColumns.map(col => (
                  <th 
                    key={col.id} 
                    className="text-center px-4 py-3 font-semibold" 
                    style={{ color: col.color || '#374151' }}
                  >
                    {col.fullName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-6 py-4 font-bold text-gray-900">All Suppliers</td>
                {esrsColumns.map(col => (
                  <td 
                    key={col.id} 
                    className="text-center px-4 py-4 text-xl font-bold" 
                    style={{ backgroundColor: col.bg || '', color: col.color || '#111827' }}
                  >
                    {enterpriseTotals[col.id]}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          <strong>Note:</strong> Data sourced from Annual Reps & Certs questionnaire responses (Questions 1007, 1009, 1010, 1012, 1014). 
          Z-Code calculations use binary encoding: L(bit0) S(bit1) SDB(bit2) WOSB(bit3) VOSB(bit4) DVOSB(bit5).
        </div>
      </div>
    </div>
  );
}
