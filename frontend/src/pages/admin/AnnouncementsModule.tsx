import React, { useState, useEffect } from 'react';
import { Plus, Megaphone, RefreshCw, Pin, Edit3, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { adminService } from '../../services/admin';
import type { AnnouncementData } from '../../services/admin';

export const AnnouncementsModule: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    id: 0,
    title: '',
    content: '',
    status: 'Published',
    pinned: false,
    target_audience: 'Entire College',
    target_value: ''
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error("Failed to load announcements archive:", err);
      showToast("Failed to retrieve announcements list.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateNew = () => {
    setForm({ id: 0, title: '', content: '', status: 'Published', pinned: false, target_audience: 'Entire College', target_value: '' });
    setIsOpen(true);
  };

  const handleEdit = (ann: AnnouncementData) => {
    setForm({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      status: ann.status,
      pinned: ann.pinned,
      target_audience: ann.target_audience,
      target_value: ann.target_value
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id > 0) {
        await adminService.editAnnouncement(form.id, form);
        showToast("Announcement details modified successfully.", "success");
      } else {
        await adminService.createAnnouncement(form);
        showToast("New announcement broadcasted successfully.", "success");
      }
      setIsOpen(false);
      fetchAnnouncements();
    } catch (err) {
      showToast("Failed to save announcement details.", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this announcement?")) return;
    try {
      await adminService.deleteAnnouncement(id);
      showToast("Announcement deleted successfully.", "success");
      fetchAnnouncements();
    } catch (err) {
      showToast("Failed to delete announcement.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-pulse text-left">
        <div className="h-16 bg-[#102117] border border-white/5 rounded-2xl" />
        <div className="h-72 bg-[#102117] border border-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn font-sans max-w-5xl mx-auto">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border animate-fadeIn ${
          toast.type === 'success' 
            ? 'bg-[#102117] border-[#22C55E]/20 text-[#22C55E]' 
            : 'bg-[#1F1116] border-rose-500/20 text-rose-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#102117] border border-white/5 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Announcements</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Broadcast notices, internship schedules, and campus drive updates to students.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 relative z-10">
          <button 
            onClick={fetchAnnouncements} 
            className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw size={13} />
          </button>
          <Button 
            onClick={handleCreateNew} 
            variant="primary" 
            size="sm" 
            className="flex items-center gap-1.5"
          >
            <Plus size={15} /> Create Announcement
          </Button>
        </div>
      </section>

      {/* Announcements List Table */}
      <Card className="bg-[#13261B] border-white/5 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102117] border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6 w-12 text-center"><Pin size={14} className="mx-auto" /></th>
                <th className="py-4 px-6">Notice Title</th>
                <th className="py-4 px-6">Message Body</th>
                <th className="py-4 px-6">Target Students</th>
                <th className="py-4 px-6">State Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
              {announcements.length > 0 ? (
                announcements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-center">
                      {ann.pinned ? (
                        <Pin size={13} className="text-[#22C55E] mx-auto animate-pulse" />
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-200 flex items-center gap-2">
                      <Megaphone size={14} className="text-emerald-500 shrink-0" />
                      {ann.title}
                    </td>
                    <td className="py-4 px-6 text-slate-400 truncate max-w-xs">
                      {ann.content}
                    </td>
                    <td className="py-4 px-6 font-black text-slate-350">
                      {ann.target_audience}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                        ann.status === 'Published' 
                          ? 'bg-[#16A34A]/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-800 text-slate-450 border border-white/5'
                      }`}>
                        {ann.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(ann)}
                          className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:border-emerald-500/30 transition-colors cursor-pointer"
                          title="Edit Announcement"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">
                    No active bulletins broadcasted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={form.id > 0 ? 'Edit Announcement Broadcast' : 'Create Announcement Broadcast'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left text-xs font-semibold text-slate-350">
          <Input 
            id="title"
            name="title"
            label="Announcement Title*"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="e.g. Stripe Recruitment Drive 2026"
          />
          <div>
            <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Message Content / Details*</label>
            <textarea 
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full p-2.5 bg-[#102117] border border-white/10 focus:border-emerald-500/30 rounded-xl text-white outline-none"
              rows={4}
              required
              placeholder="Provide job details, links, or dates..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-455 block mb-1">Target Audience</label>
              <select
                value={form.target_audience}
                onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#102117] border border-white/10 rounded-xl text-slate-200 outline-none"
              >
                <option value="Entire College">Entire College</option>
                <option value="BCA Students">BCA Students</option>
                <option value="CSE Students">CSE Students</option>
                <option value="ISE Students">ISE Students</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-455 block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#102117] border border-white/10 rounded-xl text-slate-200 outline-none"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2 bg-white/5 p-3 rounded-xl border border-white/5">
            <input 
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-white/10"
            />
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300">Pin to top of student bulletin board</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Broadcast Alert</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AnnouncementsModule;
