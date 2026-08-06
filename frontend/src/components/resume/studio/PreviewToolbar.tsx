import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';

interface PreviewToolbarProps {
  zoom: number;
  setZoom: (z: number | ((prev: number) => number)) => void;
  onDownload: () => void;
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  zoom,
  setZoom,
  onDownload
}) => {
  return (
    <div className="shrink-0 flex justify-between items-center px-4 py-2.5 bg-white border-b border-slate-200 rounded-xl shadow-xs">
      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => setZoom(prev => Math.max(50, prev - 10))}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>
        <span className="text-[10px] font-black text-slate-500 w-10 text-center">
          {zoom}%
        </span>
        <button 
          onClick={() => setZoom(prev => Math.min(150, prev + 10))}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={13} />
        </button>
        <div className="h-4 w-[1px] bg-slate-200 mx-1.5"></div>
        <button 
          onClick={() => setZoom(85)}
          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-600 cursor-pointer"
        >
          Fit Width
        </button>
        <button 
          onClick={() => setZoom(100)}
          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-600 cursor-pointer"
        >
          100%
        </button>
        <button 
          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-600 cursor-pointer"
        >
          A4
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onDownload}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer"
          title="Download PDF"
        >
          <Download size={13} />
        </button>
        <button 
          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer"
          title="Fullscreen"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    </div>
  );
};

export default PreviewToolbar;
