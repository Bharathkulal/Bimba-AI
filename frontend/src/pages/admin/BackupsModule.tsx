import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Database } from 'lucide-react';
import { Button } from '../../components/Button';
import { adminService } from '../../services/admin';
import type { BackupData } from '../../services/admin';

export const BackupsModule: React.FC = () => {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getBackups();
      setBackups(data);
    } catch (err) {
      console.error("Failed to load backups directory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreate = async () => {
    try {
      setCreating(true);
      await adminService.createBackup();
      alert("System database snapshot created successfully.");
      fetchBackups();
    } catch (err) {
      alert("Backup sequence failed.");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm("WARNING: Overwriting database with snapshot target will revert current settings. Proceed?")) return;
    try {
      await adminService.restoreBackup(id);
      alert("Database snapshot restored successfully. Refreshing session...");
      window.location.reload();
    } catch (err) {
      alert("Restore procedure failed.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this backup archive from storage servers?")) return;
    try {
      await adminService.deleteBackup(id);
      fetchBackups();
    } catch (err) {
      alert("Delete operation failed.");
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 animate-fadeIn text-left">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Database Snapshot Vault</h2>
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1">Manage system backups restore point configurations and S3 storage targets</p>
        </div>

        <div className="flex gap-2">
          <button onClick={fetchBackups} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer">
            <RefreshCw size={13} />
          </button>
          <Button onClick={handleCreate} disabled={creating} variant="primary" size="sm" className="bg-blue-600 font-bold gap-1 text-[11px]">
            <Database size={14} /> {creating ? 'Snapshotting...' : 'Create Snapshot'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
        <table className="w-full text-left text-xs font-medium border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
              <th className="py-3 px-4">Backup Snapshot Target</th>
              <th className="py-3 px-4">Storage Type</th>
              <th className="py-3 px-4">File Size bytes</th>
              <th className="py-3 px-4">Snapshot Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions Panel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {backups.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                  No system backup logs found in directory vault.
                </td>
              </tr>
            ) : (
              backups.map((bak) => (
                <tr key={bak.id} className="hover:bg-slate-50/50 transition-smooth">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-750">{bak.filename}</td>
                  <td className="py-3.5 px-4 font-black uppercase text-slate-450 text-[9px]">{bak.backup_type}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-600">{(bak.size_bytes / 1024).toFixed(1)} KB</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-450">{new Date(bak.created_at).toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                      {bak.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button
                        onClick={() => handleRestore(bak.id)}
                        className="px-2.5 py-1 rounded-lg border border-orange-200 hover:bg-orange-50 text-[10px] font-bold text-orange-600 cursor-pointer"
                        title="Restore SQLite DB state"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDelete(bak.id)}
                        className="p-1 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete backup snapshot file"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default BackupsModule;
