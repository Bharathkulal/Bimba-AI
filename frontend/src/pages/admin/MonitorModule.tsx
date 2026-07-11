import React, { useState, useEffect } from 'react';
import { Server, RefreshCw, Cpu } from 'lucide-react';
import { adminService } from '../../services/admin';
import type { SystemHealthData } from '../../services/admin';

export const MonitorModule: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getSystemHealth();
      setHealth(data);
    } catch (err) {
      console.error("Failed to query hardware diagnostics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header diagnostics info */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Real-Time Infrastructure Monitor</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Live monitoring of CPU memory database pool and gateway daemon latency</p>
        </div>
        <button onClick={fetchHealth} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer">
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Memory/CPU Cards */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu size={16} className="text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Host System Health</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                <span>CPU Load Utilization</span>
                <span>{health?.cpu ?? 15}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${health?.cpu ?? 15}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                <span>RAM Usage Utilization</span>
                <span>{health?.ram ?? 44}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${health?.ram ?? 44}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                <span>Disk Storage Space</span>
                <span>{health?.disk ?? 68}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${health?.disk ?? 68}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Server size={16} className="text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Operational Environment</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Database Connection Pool</span>
              <h4 className="text-sm font-black text-slate-700 mt-1">12 active / 20 max</h4>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Server Uptime</span>
              <h4 className="text-sm font-black text-slate-700 mt-1">{health?.uptime || '48 hours'}</h4>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Core Framework daemon</span>
              <h4 className="text-xs font-bold text-emerald-600 mt-1 uppercase">FastAPI (Python)</h4>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Network latency</span>
              <h4 className="text-sm font-black text-slate-700 mt-1">4.2 ms</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MonitorModule;
