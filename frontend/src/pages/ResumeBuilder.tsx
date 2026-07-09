import { ChevronLeft, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const ResumeBuilder: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-64px)]">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm" className="p-2">
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Software Engineer Resume</h1>
            <p className="text-xs text-slate-400">Draft version • Saved 2m ago</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Eye size={16} /> Preview
          </Button>
          <Button variant="primary" size="sm" className="gap-2">
            <Download size={16} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Workspace split screen */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden h-full pb-6">
        {/* Editor Panel */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
          <Card className="flex flex-col gap-4">
            <h3 className="font-bold text-slate-800 text-base">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Full Name</span>
                <span className="text-sm font-semibold text-slate-700">Sarah Jenkins</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Email</span>
                <span className="text-sm font-semibold text-slate-700">sarah.j@example.com</span>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Work Experience</h3>
              <Button variant="ghost" size="sm" className="text-primary font-bold">
                + Add Experience
              </Button>
            </div>
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-800">Senior Product Designer</h4>
                <span className="text-xs text-slate-400">2023 - Present</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Stripe • San Francisco, CA</span>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Led the redesign of the payment link dashboard, reducing checkout friction by 14% and generating $2.4M in incremental monthly processing.
              </p>
            </div>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="hidden lg:flex flex-col bg-slate-200/50 rounded-2xl border border-slate-300/40 p-8 overflow-y-auto relative items-center">
          {/* Mock Document Page */}
          <div className="w-full max-w-[500px] bg-white rounded-md shadow-2xl p-8 aspect-[1/1.4] flex flex-col gap-4 border border-slate-100">
            <div className="text-center pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Sarah Jenkins</h2>
              <p className="text-xs text-slate-500">sarah.j@example.com • 415-555-0199 • San Francisco, CA</p>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Experience</h3>
              <hr className="border-slate-200" />
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                  <span>Senior Product Designer @ Stripe</span>
                  <span>2023 - Pres.</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Led the redesign of the checkout platform, improving transaction completion rates by 14%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
