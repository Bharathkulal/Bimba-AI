import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, RefreshCw, Clock } from 'lucide-react';
import { aiAdminService } from '../../services/aiAdmin';
import type { AIGatewayLogItem } from '../../services/aiAdmin';

export const LogsModule: React.FC = () => {
  const [logs, setLogs] = useState<AIGatewayLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await aiAdminService.getLogs();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExport = () => {
    window.open('/api/admin/logs/export', '_blank');
  };

  const filteredLogs = logs.filter(log => 
    (log.provider || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.feature || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.user || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 animate-fadeIn text-left">
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-slate-105 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Database Audit Logging Logs</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Live tracking of administrator actions API endpoints consumption and system database overrides</p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search audit operations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.8 rounded-xl bg-slate-50 border border-slate-250 focus:border-blue-500 focus:outline-none text-xs text-slate-700 font-medium"
            />
          </div>
          <button onClick={fetchLogs} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer">
            <RefreshCw size={13} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.8 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase shadow-sm cursor-pointer"
          >
            <FileSpreadsheet size={12} /> Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
        <table className="w-full text-left text-xs font-medium border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
              <th className="py-3 px-4">Timestamp date</th>
              <th className="py-3 px-4">Operator session</th>
              <th className="py-3 px-4">Operation Target</th>
              <th className="py-3 px-4">Features modules</th>
              <th className="py-3 px-4">Latency ms</th>
              <th className="py-3 px-4 text-right">Status State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                  No operational audit events registered.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-smooth">
                  <td className="py-3.5 px-4 font-semibold text-slate-450 flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" /> {log.time}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{log.user || 'system'}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-600">{log.provider}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-650 text-[10px] uppercase">{log.feature}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-500">{log.latency || 'N/A'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                      log.status === 'Success'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : 'bg-rose-50 border-rose-100 text-rose-600'
                    }`}>
                      {log.status}
                    </span>
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
export default LogsModule;
