import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Bell, RefreshCw, Send } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { placementService } from '../../services/placement';
import type { PlacementAnnouncement } from '../../services/placement';

export const AnnouncementsManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<PlacementAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('All');

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const data = await placementService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Fields are required.");
      return;
    }

    try {
      await placementService.createAnnouncement({ title, content, target_audience: targetAudience });
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      setTargetAudience('All');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert("Failed to post announcement.");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Placement Announcements</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            Broadcast notifications to graduating classes and candidates
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-250/20 cursor-pointer"
        >
          <Plus size={14} /> Send Announcement
        </Button>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading broadcasts...</div>
      ) : announcements.length > 0 ? (
        <div className="flex flex-col gap-4">
          {announcements.map((ann) => (
            <Card key={ann.id} className="hover:border-[#E5E7EB] transition-colors relative p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/10">
                    <Megaphone size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{ann.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] bg-slate-100 dark:bg-white/5 text-slate-500 px-2 py-0.5 rounded border border-slate-200/50 dark:border-white/10 font-bold uppercase tracking-wider">
                        Audience: {ann.target_audience}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">• Published Recently</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-550 dark:text-slate-350 leading-relaxed font-medium mt-4 whitespace-pre-wrap border-t border-slate-100 dark:border-white/5 pt-3">
                {ann.content}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-slate-400 bg-white dark:bg-[#102117]/10 border border-slate-200/60 dark:border-white/5 rounded-3xl">
          No announcements sent yet.
        </div>
      )}

      {/* Save Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Broadcast Placement Announcement"
      >
        <form onSubmit={handleCreateAnnouncement} className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
              Target Audience
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
            >
              <option value="All">All Students</option>
              <option value="CS">CS Only</option>
              <option value="BCA">BCA Only</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
              Announcement Title
            </label>
            <Input
              type="text"
              placeholder="e.g. Schedule Update: Vercel Interviews"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
              Content / Message Body
            </label>
            <textarea
              placeholder="Provide complete details on timing, eligibility lists, or requirements."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-655 dark:text-slate-350 min-h-[110px]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5">
              <Send size={13} /> Publish Broadcast
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default AnnouncementsManagement;
