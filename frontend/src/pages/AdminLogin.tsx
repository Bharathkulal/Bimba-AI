import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/Button';
import { adminService } from '../services/admin';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username and Password are required.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const res = await adminService.login(username, password);
      if (res.success) {
        navigate('/admin/dashboard');
      } else {
        setError("Invalid username or password.");
      }
    } catch (err) {
      setError("Invalid username or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans px-6 select-none relative overflow-hidden">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[55%] h-[55%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-3xl p-8 shadow-xl shadow-slate-100/50 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10 mb-4.5">
            <Cpu size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SaaS Console Login</h1>
          <p className="text-slate-450 text-xs mt-1.5 font-bold uppercase tracking-wider">Bimba AI Administrators</p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200/60 rounded-2xl p-4 flex items-start gap-3 text-red-650 text-xs font-semibold animate-fadeIn">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1.5 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Enter admin username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 placeholder:text-slate-450 font-medium transition-smooth"
              />
            </div>
          </div>

          <div className="text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1.5 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 placeholder:text-slate-450 font-medium transition-smooth"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer flex items-center justify-center"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 font-bold mt-3"
          >
            {isSubmitting ? "Authenticating..." : "Login to Console"}
          </Button>
        </form>
      </div>
    </div>
  );
};
export default AdminLogin;
