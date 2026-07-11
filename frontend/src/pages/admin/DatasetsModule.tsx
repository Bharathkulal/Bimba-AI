import React, { useState, useEffect } from 'react';
import { Database, DownloadCloud, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '../../components/Button';
import { adminService } from '../../services/admin';
import type { DatasetImportData } from '../../services/admin';

export const DatasetsModule: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetImportData[]>([]);
  const [uploadPreview, setUploadPreview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getDatasets();
      setDatasets(data);
    } catch (err) {
      console.error("Failed to load dataset archives:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const preview = await adminService.uploadDataset(file);
      setUploadPreview(preview);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Upload and validation checks failed.");
    }
  };

  const commitImport = async (importType: 'merge' | 'replace') => {
    if (!uploadPreview) return;
    try {
      await adminService.importDataset(uploadPreview.filename, importType, uploadPreview.records);
      alert("Dataset records successfully committed to academic database.");
      setUploadPreview(null);
      fetchHistory();
    } catch (err) {
      alert("Failed to commit dataset imports.");
    }
  };

  const handleRollback = async (id: number) => {
    if (!window.confirm("Rollback this import? New student records created in this session will be permanently deleted.")) return;
    try {
      await adminService.rollbackDataset(id);
      alert("Import operation successfully rolled back.");
      fetchHistory();
    } catch (err) {
      alert("Rollback procedure failed.");
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Upload Box */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Import Student Academic Datasets</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Upload CSV or XLSX sheets to sync student credentials & details</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-center">
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 cursor-pointer w-full lg:w-96 transition-smooth bg-slate-50/50">
            <Database className="text-slate-400" size={28} />
            <div className="text-center">
              <span className="text-xs font-black text-slate-650 block">Choose dataset spreadsheets</span>
              <span className="text-[9px] text-slate-400 font-bold block mt-1">Accepts .CSV or .XLSX format</span>
            </div>
            <input type="file" accept=".csv,.xlsx" onChange={handleUpload} className="hidden" />
          </label>
          
          <div className="flex flex-col gap-2 justify-center">
            <h4 className="font-bold text-xs text-slate-700">Need standard headers outline?</h4>
            <p className="text-[10px] text-slate-450 font-semibold leading-relaxed max-w-sm">
              Verify column layout schema includes: roll_number, student_name, email, dob, department, semester.
            </p>
            <a href="/api/admin/dataset/template" download className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1.5 mt-1">
              <DownloadCloud size={14} /> Download Sample Template Header Sheet
            </a>
          </div>
        </div>

        {uploadPreview && (
          <div className="border border-slate-200/60 rounded-2xl p-4 bg-slate-50/50 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="font-extrabold text-xs text-slate-800">Previewing: {uploadPreview.filename}</h4>
                <p className="text-[10px] text-slate-450 font-bold mt-1 uppercase">
                  Total rows: {uploadPreview.total} | Valid: {uploadPreview.valid} | Failed checks: {uploadPreview.failed}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => commitImport('merge')} variant="primary" size="sm" className="bg-blue-600 font-bold gap-1 text-[11px]">
                  Commit Merge <ArrowRight size={12} />
                </Button>
                <Button onClick={() => commitImport('replace')} variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[11px]">
                  Replace Entire Table
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar border border-slate-200/60 rounded-xl bg-white max-h-56">
              <table className="w-full text-xs font-medium border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="py-2.5 px-3">Roll number</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Sem</th>
                    <th className="py-2.5 px-3">Validation Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {uploadPreview.records.map((rec: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-bold text-slate-750">{rec.roll_number}</td>
                      <td className="py-2 px-3 font-semibold text-slate-650">{rec.student_name}</td>
                      <td className="py-2 px-3 text-slate-500">{rec.email}</td>
                      <td className="py-2 px-3 font-bold text-slate-600">{rec.department}</td>
                      <td className="py-2 px-3 font-semibold">{rec.semester}</td>
                      <td className="py-2 px-3">
                        {rec.issues && rec.issues.length > 0 ? (
                          <span className="text-rose-500 font-black text-[9px] uppercase border border-rose-100 bg-rose-50 px-1.5 py-0.5 rounded">
                            {rec.issues.join(", ")}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-black text-[9px] uppercase border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 rounded">
                            OK ({rec.is_update ? 'Update' : 'New'})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Dataset History */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-850">Operational Import History Logs</h3>
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">List of previous imports session rollback endpoints</p>
        </div>

        <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse font-medium">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                <th className="py-3 px-4">Filename Target</th>
                <th className="py-3 px-4">Import Type</th>
                <th className="py-3 px-4">Imported records</th>
                <th className="py-3 px-4">Rejected rows</th>
                <th className="py-3 px-4">Import Date</th>
                <th className="py-3 px-4 text-right">Emergency rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {datasets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No import history registered.
                  </td>
                </tr>
              ) : (
                datasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-slate-50/50 transition-smooth">
                    <td className="py-3.5 px-4 font-bold text-slate-750">{dataset.filename}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                        {dataset.import_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      +{dataset.imported_count} / ~{dataset.updated_count}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-500">
                      {dataset.skipped_count} / {dataset.failed_count}
                    </td>
                    <td className="py-3.5 px-4 text-slate-450 font-semibold">
                      {new Date(dataset.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {dataset.rollback_status === 'Active' ? (
                        <button
                          onClick={() => handleRollback(dataset.id)}
                          className="flex items-center gap-1 text-[9px] text-rose-650 hover:bg-rose-50 border border-rose-150 px-2.5 py-1 rounded-lg font-black uppercase ml-auto cursor-pointer"
                        >
                          <RotateCcw size={10} /> Rollback
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">
                          Rolled Back
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default DatasetsModule;
