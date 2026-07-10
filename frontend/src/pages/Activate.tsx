import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Activate: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login?mode=activate', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};
export default Activate;
