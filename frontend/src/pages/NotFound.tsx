import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-400/10 blur-[100px] z-0" />
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md">
        <h1 className="text-8xl font-extrabold text-primary tracking-wider !my-0">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mt-2">
          Page Not Found
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button onClick={() => navigate('/')} variant="primary" className="gap-2 mt-2">
          <Home size={16} /> Back to Home
        </Button>
      </div>
    </div>
  );
};
