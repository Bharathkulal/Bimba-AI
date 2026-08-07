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
    <div className="shrink-0 flex justify-between items-center px-4 py-2 bg-white border-b border-[#E5E5E2] rounded-t-2xl select-none">
      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => setZoom(prev => Math.max(50, prev - 10))}
          className="p-1 bg-white hover:bg-slate-50 border border-[#E5E5E2] rounded text-[#1A1A1A] transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={12} />
        </button>
        <span className="text-[10px] font-extrabold text-[#1A1A1A] w-10 text-center">
          {zoom}%
        </span>
        <button 
          onClick={() => setZoom(prev => Math.min(150, prev + 10))}
          className="p-1 bg-white hover:bg-slate-50 border border-[#E5E5E2] rounded text-[#1A1A1A] transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={12} />
        </button>
        <div className="h-4 w-[1px] bg-[#E5E5E2] mx-1.5"></div>
        <button 
          onClick={() => setZoom(zoom === 100 ? 85 : 100)}
          className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-[#E5E5E2] rounded text-[9px] font-extrabold text-[#1A1A1A] cursor-pointer"
        >
          {zoom === 100 ? 'Fit Width' : '100%'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onDownload}
          className="p-1 bg-white hover:bg-slate-50 border border-[#E5E5E2] rounded text-[#1A1A1A] transition-all cursor-pointer"
          title="Download PDF"
        >
          <Download size={12} />
        </button>
        <button 
          className="p-1 bg-white hover:bg-slate-50 border border-[#E5E5E2] rounded text-[#1A1A1A] transition-all cursor-pointer"
          title="Fullscreen"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
};

export default PreviewToolbar;
