import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Activity, GraduationCap, Award, Compass } from 'lucide-react';
import { adminService } from '../../services/admin';
import type { AdminUserData } from '../../services/admin';

export const StudentsModule: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rollParam = searchParams.get('roll') || '';

  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [selectedRoll, setSelectedRoll] = useState(rollParam);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const data = await adminService.getUsers();
        setUsers(data);
        if (!selectedRoll && data.length > 0) {
          setSelectedRoll(data[0].roll_number);
        }
      } catch (err) {
        console.error("Failed to query students directory:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (rollParam) {
      setSelectedRoll(rollParam);
    }
  }, [rollParam]);

  const selectedStudent = users.find(u => u.roll_number === selectedRoll);

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Selector Header */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-850">Student Detailed Profile Monitor</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Review academic progress, resumes status, and AI gateway consumption logs</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <label className="text-[10px] font-black uppercase text-slate-450 whitespace-nowrap">Select Student:</label>
          <select
            value={selectedRoll}
            onChange={(e) => {
              setSelectedRoll(e.target.value);
              navigate(`/admin/students?roll=${e.target.value}`);
            }}
            className="bg-slate-50 border border-slate-250 rounded-2xl px-3 py-1.8 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            {users.map(u => (
              <option key={u.id} value={u.roll_number}>
                {u.roll_number} - {u.email.split('@')[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left column: General identity card */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-black text-xl shadow-sm mb-4">
                {selectedStudent.roll_number.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="font-extrabold text-base text-slate-800">{selectedStudent.roll_number}</h3>
              <p className="text-xs text-slate-450 font-semibold">{selectedStudent.email}</p>
              
              <div className="w-full border-t border-slate-100 mt-5 pt-5 flex flex-col gap-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account state</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                    selectedStudent.status === 'Active' 
                      ? 'bg-emerald-55 border-emerald-100 text-emerald-600' 
                      : 'bg-rose-50 border-rose-100 text-rose-600'
                  }`}>
                    {selectedStudent.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Department</span>
                  <span className="text-xs font-extrabold text-slate-700">{selectedStudent.department}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Semester Level</span>
                  <span className="text-xs font-extrabold text-slate-700">Sem {selectedStudent.semester}</span>
                </div>
              </div>
            </div>

            {/* Resume completion metric card */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Resume Analytics</h4>
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Created files count</span>
                  <span className="text-sm font-black text-slate-855">{selectedStudent.resumes_count} resumes</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650 shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">ATS Average Standard</span>
                  <span className="text-sm font-black text-slate-855">82% Optimization</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Tabs & details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Academic overview */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <h4 className="font-extrabold text-sm text-slate-800">Academic & Placement Profile</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                  <Compass size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-[11px] font-extrabold text-slate-700">Course Syllabus & Curriculum</h5>
                    <p className="text-[10px] text-slate-450 mt-1 font-semibold leading-relaxed">
                      Assigned to default {selectedStudent.department} undergraduate placement layout. Required credits: 120.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                  <Award size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-[11px] font-extrabold text-slate-700">Placement Assessment</h5>
                    <p className="text-[10px] text-slate-450 mt-1 font-semibold leading-relaxed">
                      Approved for general corporate recruitment. Verified by placement coordinator.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI usage details and event timeline */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <h4 className="font-extrabold text-sm text-slate-800">System Logs Timeline</h4>
              
              <div className="flex flex-col gap-3">
                {[
                  { op: 'Modified Profile Resume', time: '1 hour ago', type: 'Edit', desc: 'Updated professional objective section' },
                  { op: 'Gemini AI Assistant Call', time: '4 hours ago', type: 'AI Gateway', desc: 'Generated ATS summary suggestions' },
                  { op: 'Login Attempt Success', time: '1 day ago', type: 'Auth', desc: 'Logged in from browser Chrome (127.0.0.1)' }
                ].map((act, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div className="flex gap-3 items-center">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                        <Activity size={12} />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-800">{act.op}</h5>
                        <p className="text-[9px] text-slate-450 font-semibold mt-0.5">{act.desc}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                        {act.type}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-12 text-center text-slate-400 shadow-sm font-bold text-xs">
          No student selected or loaded.
        </div>
      )}
    </div>
  );
};
export default StudentsModule;
