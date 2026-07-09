import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/activate', { replace: true });
  }, [navigate]);

  return null;
};
export default Register;
