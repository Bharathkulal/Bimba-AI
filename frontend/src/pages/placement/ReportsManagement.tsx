import React, { useState, useEffect } from 'react';
import { BarChart3, Download, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { placementService } from '../../services/placement';
import type { PlacementReportData } from '../../services/placement';

export const ReportsManagement: React.FC = () => {
  const [report, setReport] = useState<PlacementReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const data = await placementService.getReports();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCSV = () => {
    if (!report || report.details.length === 0) return;

    const headers = ['Roll Number', 'Student Name', 'Department', 'CGPA', 'Eligibility Status', 'Placement Status'];
    const csvRows = [
      headers.join(','),
      ...report.details.map(row => [
        row.roll_number,
        `"${row.name.replace(/"/g, '""')}"`,
        row.department,
        row.cgpa,
        row.eligibility,
        row.status
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bimba_AI_Placement_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Reports & Export</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            Export structured candidate placement data for institute audits
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={isLoading || !report}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-250/20 cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet size={14} /> Export CSV Report
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading audit data...</div>
      ) : report ? (
        <div className="flex flex-col gap-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="hover:border-slate-200">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
              <span className="text-3xl font-black mt-2 block leading-none">{report.summary.total_students}</span>
            </Card>
            <Card className="hover:border-slate-200">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Placed Count</span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 block leading-none">{report.summary.placed_students}</span>
            </Card>
            <Card className="hover:border-slate-200">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Placement Percentage</span>
              <span className="text-3xl font-black text-indigo-650 dark:text-indigo-400 mt-2 block leading-none">{report.summary.placement_percentage}%</span>
            </Card>
            <Card className="hover:border-slate-200">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Recruitment Drives</span>
              <span className="text-3xl font-black mt-2 block leading-none">{report.summary.total_drives}</span>
            </Card>
          </div>

          {/* Details Table preview */}
          <Card className="p-0 overflow-x-auto">
            <div className="p-5 border-b border-slate-100 dark:border-white/5">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Report Preview</h3>
              <p className="text-[9px] text-slate-450 uppercase font-bold mt-0.5">Top entries of the final audit document</p>
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 font-extrabold uppercase bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 py-3.5">Roll Number</th>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5 text-center">CGPA</th>
                  <th className="px-6 py-3.5 text-center">Eligibility</th>
                  <th className="px-6 py-3.5 text-right">Placement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {report.details.map((det) => (
                  <tr key={det.roll_number} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-900 dark:text-white">{det.roll_number}</td>
                    <td className="px-6 py-3 text-slate-750 dark:text-slate-200">{det.name}</td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-450 font-bold">{det.department}</td>
                    <td className="px-6 py-3 text-center text-slate-655 dark:text-slate-350 font-bold">
                      {det.cgpa !== null && det.cgpa !== undefined ? det.cgpa : '-'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase border ${
                        det.eligibility === 'Eligible' 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600'
                      }`}>
                        {det.eligibility}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase border ${
                        det.status === 'Placed' 
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                      }`}>
                        {det.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-slate-400">Failed to render placement reports.</div>
      )}
    </div>
  );
};
export default ReportsManagement;
