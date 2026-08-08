import React, { useState } from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { Card } from '../../Card';
import { Button } from '../../Button';
import { Kanban, List, Calendar, Building, Sparkles } from 'lucide-react';

interface TrackerCard {
  id: string;
  company: string;
  role: string;
  status: 'saved' | 'applied' | 'interview' | 'offer';
  date: string;
}

export const ApplicationTrackerStep: React.FC = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  
  const [items, setItems] = useState<TrackerCard[]>([
    { id: '1', company: 'Google Inc.', role: 'Associate Software Engineer', status: 'applied', date: '2026-08-01' },
    { id: '2', company: 'Stripe Co.', role: 'Frontend React Developer', status: 'saved', date: '2026-08-04' },
    { id: '3', company: 'Microsoft', role: 'Full Stack Consultant', status: 'interview', date: '2026-08-08' },
    { id: '4', company: 'Netflix', role: 'AI Platform Engineer', status: 'offer', date: '2026-08-05' }
  ]);

  const handleStatusChange = (id: string, nextStatus: TrackerCard['status']) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
  };

  const columns: { id: TrackerCard['status']; label: string }[] = [
    { id: 'saved', label: 'Saved Jobs' },
    { id: 'applied', label: 'Applied' },
    { id: 'interview', label: 'Interviewing' },
    { id: 'offer', label: 'Offers / Accepted' }
  ];

  return (
    <div className="max-w-5xl w-full flex flex-col gap-5 py-4 text-left">
      
      {/* Board toolbar */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Kanban size={15} className="text-emerald-500" /> Job Application Pipeline
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Monitor applications progress and status timelines</p>
        </div>

        <div className="flex items-center gap-1.5 border border-slate-200 dark:border-white/10 rounded-xl p-1 bg-white dark:bg-white/5">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded-lg cursor-pointer transition-all ${viewMode === 'kanban' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-450 hover:text-slate-800'}`}
          >
            <Kanban size={13} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg cursor-pointer transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-450 hover:text-slate-800'}`}
          >
            <List size={13} />
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban Grid columns */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start min-h-[350px]">
          {columns.map((col) => {
            const colItems = items.filter(item => item.status === col.id);
            return (
              <div key={col.id} className="flex flex-col gap-3.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 p-4 rounded-3xl min-h-[300px]">
                <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">
                  {col.label} ({colItems.length})
                </span>
                
                <div className="flex flex-col gap-3">
                  {colItems.map((item) => (
                    <Card key={item.id} className="p-3 bg-white dark:bg-[#1E293B] border border-slate-250/50 dark:border-white/5 shadow-sm space-y-2.5">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-[11px] text-slate-800 dark:text-white leading-tight">{item.role}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Building size={11} className="text-slate-400" /> {item.company}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center text-[8px] font-bold text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Calendar size={10} /> {item.date}
                        </span>
                        
                        {/* Status switcher selector fallback */}
                        <select
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-[9px] font-black rounded px-1 py-0.5 focus:outline-none"
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                        </select>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table alternate view list */
        <Card className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] overflow-hidden rounded-3xl shadow-sm">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-black uppercase text-slate-400 bg-slate-50/50 dark:bg-white/5">
                <th className="p-4">Position Role</th>
                <th className="p-4">Company</th>
                <th className="p-4">Pipeline Status</th>
                <th className="p-4">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300">
                  <td className="p-4 font-bold">{item.role}</td>
                  <td className="p-4">{item.company}</td>
                  <td className="p-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      item.status === 'offer' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

    </div>
  );
};
export default ApplicationTrackerStep;
