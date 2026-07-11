import React, { useState, useEffect } from 'react';
import { Server, Send } from 'lucide-react';
import { Button } from '../../components/Button';
import { adminService } from '../../services/admin';
import type { EmailTemplateData, EmailLogData } from '../../services/admin';

export const EmailModule: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplateData[]>([]);
  const [logs, setLogs] = useState<EmailLogData[]>([]);
  const [config, setConfig] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_username: 'noreply@bimba.ai',
    smtp_password: '••••••••••••••••',
    smtp_encryption: 'TLS'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Editor modal state
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tplData, logData, cfgData] = await Promise.all([
        adminService.getEmailTemplates(),
        adminService.getEmailLogs(),
        adminService.getEmailConfig()
      ]);
      setTemplates(tplData);
      setLogs(logData);
      setConfig(cfgData);
    } catch (err) {
      console.error("Failed to load email configurations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditTemplate = (tpl: EmailTemplateData) => {
    setForm({
      name: tpl.name,
      subject: tpl.subject,
      body: tpl.body
    });
    setIsOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.updateEmailTemplate(form.name, form);
      setIsOpen(false);
      fetchData();
    } catch (err) {
      alert("Failed to save template.");
    }
  };

  const handleRetryFailed = async () => {
    try {
      const res = await adminService.retryFailedEmails();
      alert(`Retried ${res.retried} emails from outbound queue.`);
      fetchData();
    } catch (err) {
      alert("Queue retry request failed.");
    }
  };

  const handleSaveSMTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.saveEmailConfig(config);
      alert("SMTP outbox settings saved successfully.");
      fetchData();
    } catch (err) {
      alert("Failed to modify outbox configurations.");
    }
  };

  const handleTestSMTP = async () => {
    try {
      const res = await adminService.testEmailConfig(config);
      if (res.success) {
        alert("SMTP Connection established successfully! Test mail sent.");
      } else {
        alert(`SMTP Connection failed: ${res.error}`);
      }
    } catch (err) {
      alert("SMTP validation connection request timed out.");
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SMTP Configuration Form */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleSaveSMTP} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Server size={18} className="text-blue-600" />
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">SMTP Server Outbox</h3>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">SMTP Host Hostname</label>
              <input
                type="text"
                value={config.smtp_host}
                onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Port</label>
                <input
                  type="number"
                  value={config.smtp_port}
                  onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) })}
                  className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Encryption</label>
                <select
                  value={config.smtp_encryption}
                  onChange={(e) => setConfig({ ...config, smtp_encryption: e.target.value })}
                  className="w-full pl-2 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  <option value="TLS">TLS</option>
                  <option value="SSL">SSL</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Username Email</label>
              <input
                type="email"
                value={config.smtp_username}
                onChange={(e) => setConfig({ ...config, smtp_username: e.target.value })}
                className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">SMTP Secret Password</label>
              <input
                type="password"
                value={config.smtp_password}
                onChange={(e) => setConfig({ ...config, smtp_password: e.target.value })}
                className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                required
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold flex-1 text-[11px]">
                Save Settings
              </Button>
              <button
                type="button"
                onClick={handleTestSMTP}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-650 cursor-pointer"
              >
                Test Connection
              </button>
            </div>
          </form>
        </div>

        {/* Templates grid List */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Email System Templates</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.name} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 flex flex-col justify-between min-h-32">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 capitalize">{tpl.name.replace(/_/g, ' ')}</h4>
                  <span className="text-[8px] text-slate-400 block font-black uppercase tracking-wide mt-1">Subject: {tpl.subject}</span>
                  <p className="text-[10px] text-slate-500 mt-2 line-clamp-3 leading-relaxed">{tpl.body}</p>
                </div>
                
                <button
                  onClick={() => handleEditTemplate(tpl)}
                  className="text-[10px] text-blue-600 font-extrabold hover:underline mt-4 text-left cursor-pointer"
                >
                  Edit Template Layout
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Outbound email history queue log */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850">Outbound Queue Log history</h3>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">Live monitoring of SMTP delivery success rate</p>
          </div>

          <button
            onClick={handleRetryFailed}
            className="flex items-center gap-1.5 px-3 py-1.8 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase shadow-sm cursor-pointer"
          >
            <Send size={10} /> Resend Failed Queue Items
          </button>
        </div>

        <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                <th className="py-3 px-4">Recipient target</th>
                <th className="py-3 px-4">Subject headline</th>
                <th className="py-3 px-4">Sent timestamp</th>
                <th className="py-3 px-4">Delivery state</th>
                <th className="py-3 px-4">Error log status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                    No emails logged in current session outbox.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-smooth">
                    <td className="py-3 px-4 font-bold text-slate-750">{log.recipient}</td>
                    <td className="py-3 px-4 font-semibold text-slate-650 truncate max-w-xs">{log.subject}</td>
                    <td className="py-3 px-4 text-slate-450">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                        log.status === 'Sent' || log.status === 'Delivered'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                          : 'bg-rose-50 border-rose-100 text-rose-600'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[9px] text-slate-400 font-semibold max-w-xs truncate">
                      {log.error_message || 'OK (No issues detected)'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <form onSubmit={handleSaveTemplate} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-xl text-left">
            <h4 className="text-sm font-extrabold text-slate-800 mb-4 capitalize">Edit Template: {form.name.replace(/_/g, ' ')}</h4>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Subject Headline</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Template Body (Markdown supported)</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 leading-relaxed"
                  rows={8}
                  required
                />
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
                Save Template Layout
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default EmailModule;
