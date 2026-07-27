import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Terminal, FileText, Users, Cpu, Shield, Database, X } from 'lucide-react';

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const commands = [
    { category: 'Navigation', label: 'Go to Dashboard', path: '/admin/dashboard', icon: Terminal },
    { category: 'Navigation', label: 'Go to Student Management', path: '/admin/users', icon: Users },
    { category: 'Navigation', label: 'Go to Resume Center', path: '/admin/resumes', icon: FileText },
    { category: 'Navigation', label: 'Go to AI Configuration', path: '/admin/ai', icon: Cpu },
    { category: 'Navigation', label: 'Go to Security Access', path: '/admin/security', icon: Shield },
    { category: 'Actions', label: 'Trigger Database Backup', action: 'backup', icon: Database },
    { category: 'Actions', label: 'Clear System Cache', action: 'cache', icon: Terminal },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleCommandClick = (cmd: typeof commands[0]) => {
    if (cmd.path) {
      navigate(cmd.path);
    } else if (cmd.action) {
      alert(`Action "${cmd.label}" executed successfully!`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] px-4 animate-fadeIn">
      <div 
        onClick={onClose}
        className="fixed inset-0 z-0"
      />
      <div className="w-full max-w-lg bg-[#0F1D15] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative z-10 text-left">
        {/* Search Input bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/5 gap-3">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text"
            placeholder="Type a command or search console..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500 font-medium"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 text-slate-450 hover:text-white cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Command Options List */}
        <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-bold">
              No matching commands or pages found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleCommandClick(cmd)}
                  className="flex items-center justify-between w-full p-3.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center -[#111111] shrink-0">
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-none">{cmd.label}</p>
                      <span className="text-[9px] text-slate-500 font-bold mt-1.5 block">{cmd.category}</span>
                    </div>
                  </div>
                  <kbd className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-slate-400 font-bold font-mono">
                    Enter
                  </kbd>
                </button>
              );
            })
          )}
        </div>

        <div className="bg-[#13241A] border-t border-white/5 px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
          <span>Search Bimba AI Admin Console</span>
          <span>Esc to Close</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCommandPalette;
