import React, { useState, useEffect } from 'react';
import { Plus, Megaphone, RefreshCw, Pin } from 'lucide-react';
import { Button } from '../../components/Button';
import { adminService } from '../../services/admin';
import type { AnnouncementData } from '../../services/admin';

export const AnnouncementsModule: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    title: '',
    content: '',
    status: 'Published',
    pinned: false,
    target_audience: 'Entire College',
    target_value: ''
  });

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error("Failed to load announcements archive:", err);
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
      } else {
        await adminService.createAnnouncement(form);
      }
      setIsOpen(false);
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to save announcement details.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this announcement?")) return;
    try {
      await adminService.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 animate-fadeIn text-left">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Announcements & Bulletins Dispatch</h2>
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1">Publish alerts broadcast push notifications and academic bulletins</p>
        </div>

        <div className="flex gap-2">
          <button onClick={fetchAnnouncements} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer">
            <RefreshCw size={13} />
          </button>
          <Button onClick={handleCreateNew} variant="primary" size="sm" className="bg-blue-600 font-bold gap-1 text-[11px]">
            <Plus size={14} /> New Broadcast
          </Button>
        </div>
      </div>

      {/* Grid of Announcements Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.length === 0 ? (
          <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-12 text-center text-slate-400 col-span-full font-bold text-xs">
            No active bulletins published.
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-slate-50/40 border border-slate-200/60 rounded-2xl p-5 flex flex-col justify-between min-h-52">
              <div>
                <div className="flex justify-between items-start">
                  <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                    Audience: {ann.target_audience}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {ann.pinned && (
                      <span className="text-orange-500" title="Pinned Announcement">
                        <Pin size={12} className="fill-orange-500" />
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                      ann.status === 'Published' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                        : 'bg-slate-100 border-slate-250 text-slate-500'
                    }`}>
                      {ann.status}
                    </span>
                  </div>
                </div>

                <h4 className="font-extrabold text-xs text-slate-800 mt-3 flex items-center gap-1.5">
                  <Megaphone size={13} className="text-slate-400" /> {ann.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-2 font-semibold leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200/60">
                <span className="text-[9px] text-slate-450 font-bold">
                  Posted: {new Date(ann.created_at).toLocaleDateString()} | Reads: {ann.read_count}
                </span>
                <div className="flex gap-2.5">
                  <button onClick={() => handleEdit(ann)} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Edit</button>
                  <button onClick={() => handleDelete(ann.id)} className="text-[10px] text-red-650 font-bold hover:underline cursor-pointer">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-xl text-left">
            <h4 className="text-sm font-extrabold text-slate-800 mb-4">{form.id > 0 ? "Edit Broadcast Bulletin" : "Create Broadcast Bulletin"}</h4>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Bulletin Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  placeholder="e.g. Campus Placement Drives 2026 Schedule"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Broadcast Content (Markdown supported)</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700"
                  placeholder="Draft details..."
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Target Audience</label>
                  <select
                    value={form.target_audience}
                    onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                    className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 cursor-pointer"
                  >
                    <option value="Entire College">Entire College</option>
                    <option value="Placement Registered">Placement Registered</option>
                    <option value="CS Department">CS Department Only</option>
                    <option value="Teachers">Teachers Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Broadcast Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 cursor-pointer"
                  >
                    <option value="Published">Published (Active)</option>
                    <option value="Draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinnedCheck"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-50 border-slate-200 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="pinnedCheck" className="text-xs font-bold text-slate-650 cursor-pointer select-none">
                  Pin announcement banner to user dashboard alerts drawer
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-655 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold text-[11px]">
                Dispatch Broadcast
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default AnnouncementsModule;
