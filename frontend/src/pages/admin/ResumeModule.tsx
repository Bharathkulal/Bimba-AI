import React, { useState, useEffect } from 'react';
import { Search, Trash2, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/admin';
import type { AdminResumeData, AdminTemplateData } from '../../services/admin';

export const ResumeModule: React.FC = () => {
  const [resumes, setResumes] = useState<AdminResumeData[]>([]);
  const [templates, setTemplates] = useState<AdminTemplateData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resData, tplData] = await Promise.all([
        adminService.getResumes(),
        adminService.getTemplates()
      ]);
      setResumes(resData);
      setTemplates(tplData);
    } catch (err) {
      console.error("Failed to fetch resume archive data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this resume portfolio from the system?")) return;
    try {
      await adminService.deleteResume(id);
      alert("Resume deleted.");
      fetchData();
    } catch (err) {
      alert("Failed to delete resume.");
    }
  };

  const filteredResumes = resumes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.student_roll.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Templates Showcase Panel */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Standard Active Showcase Layouts</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Configure designer layouts and check parser compliance score levels</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-5">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-slate-50/50 p-4 border border-slate-150 rounded-2xl flex flex-col justify-between min-h-36 hover:border-emerald-300 transition-all duration-200">
              <div>
                <div className="flex justify-between items-start">
                  <span className="bg-emerald-50/70 border border-emerald-100 text-emerald-650 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                    {tpl.category}
                  </span>
                  <span className="text-[9px] font-black text-slate-400">ATS: {tpl.score}%</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-800 mt-3">{tpl.name}</h4>
                <p className="text-[9px] text-slate-450 mt-1 font-semibold leading-relaxed">{tpl.description}</p>
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-3 mt-3">
                <span className="text-[8px] text-slate-400 font-bold uppercase">Layout Enabled</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumes Data List */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850">Student Portfolio Document Archives</h3>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">Database record of resumes currently stored on backend servers</p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search portfolios name, student roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.8 rounded-xl bg-slate-50 border border-slate-250 focus:border-blue-500 focus:outline-none text-xs text-slate-700 font-medium"
              />
            </div>
            <button onClick={fetchData} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                <th className="py-3 px-4">Portfolio File Name</th>
                <th className="py-3 px-4">Author Student Roll</th>
                <th className="py-3 px-4">Design Layout template</th>
                <th className="py-3 px-4">ATS Compliance Score</th>
                <th className="py-3 px-4">State Status</th>
                <th className="py-3 px-4 text-right">Delete Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResumes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-450 font-bold">
                    No resume portfolio documents found.
                  </td>
                </tr>
              ) : (
                filteredResumes.map((resume) => (
                  <tr key={resume.id} className="hover:bg-slate-50/50 transition-smooth">
                    <td className="py-3.5 px-4 font-bold text-slate-750">{resume.name}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-550">{resume.student_roll}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-450">{resume.template}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg text-[9px] font-black">
                        ATS {resume.ats_score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-450">{resume.status}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="p-1.5 rounded-lg border border-rose-250 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer ml-auto block"
                        title="Delete resume from system database"
                      >
                        <Trash2 size={12} />
                      </button>
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
export default ResumeModule;
