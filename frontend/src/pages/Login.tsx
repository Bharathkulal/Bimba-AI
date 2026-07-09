import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { apiClient } from '../services/api';

const loginSchema = z.object({
  roll_number: z.string().min(3, { message: 'Enter a valid Roll Number' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginSchema = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const setUser = useUserStore((state) => state.setUser);
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await apiClient.post('/api/auth/login', data);
      const { access_token, student } = response.data;
      setUser(student, access_token);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setApiError(err.response.data.detail);
      } else {
        setApiError('An error occurred. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-400/10 blur-[100px] z-0" />
      <Card className="w-full max-w-md relative z-10 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Student Portal</h2>
          <p className="text-sm text-slate-400 mt-1">Log in to access your placement profile</p>
        </div>

        {apiError && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input
            id="roll_number"
            label="Roll Number"
            type="text"
            placeholder="e.g. BCA25008"
            error={errors.roll_number?.message}
            {...register('roll_number')}
          />
          <div className="flex flex-col gap-1">
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end mt-1">
              <Link to="/activate?mode=reset" className="text-xs font-semibold text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Log In
          </Button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500">
          New student?{' '}
          <Link to="/activate" className="text-primary font-bold hover:underline">
            Activate your account
          </Link>
        </div>
      </Card>
    </div>
  );
};
export default Login;
