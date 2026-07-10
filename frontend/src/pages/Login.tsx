import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { apiClient } from '../services/api';
import { CheckCircle, ShieldAlert, Sparkles, KeyRound, Mail, ArrowRight, Copy, Check, ArrowLeft } from 'lucide-react';

// Validation Schemas
const loginSchema = z.object({
  roll_number: z.string().min(3, { message: 'Enter a valid Roll Number' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const activateSchema = z.object({
  roll_number: z.string().min(3, { message: 'Enter a valid Roll Number' }),
  date_of_birth: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, { message: 'Date of Birth must be in format DD-MM-YYYY' }),
});

const otpSchema = z.object({
  otp_code: z.string().length(6, { message: 'OTP must be exactly 6 digits' }),
});

const passwordSchema = z.object({
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Must contain at least one special character' }),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type LoginSchema = z.infer<typeof loginSchema>;
type ActivateSchema = z.infer<typeof activateSchema>;
type OtpSchema = z.infer<typeof otpSchema>;
type PasswordSchema = z.infer<typeof passwordSchema>;

export const Login: React.FC = () => {
  const setUser = useUserStore((state) => state.setUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'activate' ? 'activate' : 'login';

  // Mode: 'login' | 'activate' | 'forgot_password'
  const [mode, setMode] = useState<'login' | 'activate' | 'forgot_password'>(initialMode);
  
  // Activation / Forgot Password Wizard Step: 1 = Verify, 2 = OTP, 3 = Password, 4 = Success
  const [step, setStep] = useState(1);
  const [rollNumber, setRollNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Copy states for test cards
  const [copiedRoll, setCopiedRoll] = useState(false);
  const [copiedDob, setCopiedDob] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forms
  const loginForm = useForm<LoginSchema>({ resolver: zodResolver(loginSchema) });
  const activateForm = useForm<ActivateSchema>({ resolver: zodResolver(activateSchema) });
  const otpForm = useForm<OtpSchema>({ resolver: zodResolver(otpSchema) });
  const passwordForm = useForm<PasswordSchema>({ resolver: zodResolver(passwordSchema) });

  const isDev = import.meta.env.DEV;

  useEffect(() => {
    setApiError(null);
    setStep(1);
  }, [mode]);

  const handleLogin = async (data: LoginSchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await apiClient.post('/api/auth/login', data);
      const { access_token, student } = response.data;
      setUser(student, access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err.response?.data?.detail || 'Incorrect Roll Number or Password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyActivationOrForgot = async (data: ActivateSchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const endpoint = mode === 'forgot_password' ? '/api/auth/forgot-password/verify' : '/api/auth/activation/verify';
      const response = await apiClient.post(endpoint, data);
      
      setRollNumber(data.roll_number);
      setStudentName(response.data.student_name);
      setMaskedEmail(response.data.email);
      if (response.data.dev_otp) {
        setDevOtp(response.data.dev_otp);
      }
      setStep(2);
    } catch (err: any) {
      setApiError(err.response?.data?.detail || 'Invalid Roll Number or Date of Birth.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (data: OtpSchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const endpoint = mode === 'forgot_password' ? '/api/auth/forgot-password/verify-otp' : '/api/auth/activation/verify-otp';
      await apiClient.post(endpoint, {
        roll_number: rollNumber,
        otp_code: data.otp_code,
        purpose: mode === 'forgot_password' ? 'forgot_password' : 'activation'
      });
      setStep(3);
    } catch (err: any) {
      setApiError(err.response?.data?.detail || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPassword = async (data: PasswordSchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const endpoint = mode === 'forgot_password' ? '/api/auth/forgot-password/reset' : '/api/auth/activation/setup-password';
      const response = await apiClient.post(endpoint, {
        roll_number: rollNumber,
        password: data.password
      });
      
      if (mode === 'activate') {
        // Automatically log in for activation success
        const { access_token, student } = response.data;
        setUser(student, access_token);
        navigate('/dashboard');
      } else {
        setStep(4);
      }
    } catch (err: any) {
      setApiError(err.response?.data?.detail || 'Failed to setup password.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden font-sans select-none">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Unified Card Container with Light Glassmorphism */}
        <Card className="w-full bg-white/80 border border-slate-200/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-slate-100/50">
          
          {/* Header Title */}
          <div className="text-center mb-8 relative">
            <button
              onClick={() => navigate('/')}
              className="absolute left-0 top-0 text-slate-450 hover:text-slate-700 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Landing
            </button>
            
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10 mx-auto mb-4">
              <Sparkles size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">Bimba AI</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Student Placement Portal</p>
          </div>

          {/* Error Alert */}
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-650 flex items-center gap-2.5">
              <ShieldAlert size={16} className="shrink-0 text-red-500" />
              <span>{apiError}</span>
            </div>
          )}

          {/* CARD 1: LOGIN */}
          {mode === 'login' && (
            <div>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="flex flex-col gap-5">
                <Input
                  id="roll_number"
                  label="Roll Number"
                  type="text"
                  placeholder="e.g. BCA24001"
                  error={loginForm.formState.errors.roll_number?.message}
                  {...loginForm.register('roll_number')}
                />
                
                <div className="flex flex-col gap-1">
                  <Input
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register('password')}
                  />
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold" isLoading={isLoading}>
                  Log In
                </Button>
              </form>

              <div className="text-center mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500">
                First time using Bimba AI?{' '}
                <button
                  onClick={() => setMode('activate')}
                  className="text-blue-600 font-bold hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Activate Account
                </button>
              </div>
            </div>
          )}

          {/* CARD 2: ACTIVATE ACCOUNT / FORGOT PASSWORD */}
          {(mode === 'activate' || mode === 'forgot_password') && (
            <div>
              {/* Step Indicators */}
              {step < 4 && (
                <div className="flex items-center justify-between mb-8 px-4">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step >= s ? 'bg-blue-600 text-white scale-110 shadow-sm' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {s}
                      </div>
                      {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-blue-600' : 'bg-slate-150'}`} />}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 1: Verify Student Record */}
              {step === 1 && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      {mode === 'forgot_password' ? 'Reset Password' : 'Activate Account'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {mode === 'forgot_password'
                        ? 'Verify your credentials to reset password'
                        : 'Enter details as provided by college placement cell'}
                    </p>
                  </div>

                  <form onSubmit={activateForm.handleSubmit(handleVerifyActivationOrForgot)} className="flex flex-col gap-5">
                    <Input
                      id="roll_number"
                      label="Roll Number"
                      type="text"
                      placeholder="e.g. BCA24001"
                      error={activateForm.formState.errors.roll_number?.message}
                      {...activateForm.register('roll_number')}
                    />
                    <Input
                      id="date_of_birth"
                      label="Date of Birth"
                      type="text"
                      placeholder="DD-MM-YYYY"
                      helperText="Enter in format Day-Month-Year (e.g. 15-08-2005)"
                      error={activateForm.formState.errors.date_of_birth?.message}
                      {...activateForm.register('date_of_birth')}
                    />

                    <div className="flex gap-3.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="w-1/2 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Back to Login
                      </button>
                      <Button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold" isLoading={isLoading}>
                        Continue
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 2: OTP Verification */}
              {step === 2 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">OTP Verification</h2>
                    <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                      Hi <strong className="text-slate-800">{studentName}</strong>, a 6-digit OTP code has been sent to your registered email:<br />
                      <span className="font-semibold text-blue-600 text-xs">{maskedEmail}</span>
                    </p>
                  </div>

                  {/* Dev Mode OTP Indicator */}
                  {isDev && devOtp && (
                    <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-600 font-semibold flex items-center gap-2">
                      <Sparkles size={16} />
                      <span>Dev Mode OTP: <strong className="text-blue-800 font-extrabold">{devOtp}</strong></span>
                    </div>
                  )}

                  <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="flex flex-col gap-5">
                    <Input
                      id="otp_code"
                      label="6-Digit OTP Code"
                      type="text"
                      placeholder="123456"
                      className="text-center tracking-[0.5em] text-lg font-bold"
                      error={otpForm.formState.errors.otp_code?.message}
                      {...otpForm.register('otp_code')}
                    />

                    <div className="flex gap-3.5">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-1/2 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <Button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold" isLoading={isLoading}>
                        Verify OTP
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 3: Password setup */}
              {step === 3 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <KeyRound size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Create Password</h2>
                    <p className="text-xs text-slate-550 mt-1.5 leading-relaxed">
                      Enter a secure password to access your placement dashboard.
                    </p>
                  </div>

                  <form onSubmit={passwordForm.handleSubmit(handleSetupPassword)} className="flex flex-col gap-4">
                    <Input
                      id="password"
                      label="New Password"
                      type="password"
                      placeholder="••••••••"
                      error={passwordForm.formState.errors.password?.message}
                      {...passwordForm.register('password')}
                    />
                    <Input
                      id="confirm_password"
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                      error={passwordForm.formState.errors.confirm_password?.message}
                      {...passwordForm.register('confirm_password')}
                    />

                    {/* Password criteria UI helper */}
                    <div className="text-[10px] text-slate-500 flex flex-col gap-1 mt-1 border border-slate-100 p-3 rounded-xl bg-slate-50">
                      <span className="font-bold text-slate-700 mb-1">Password Requirements:</span>
                      <span>• Minimum 8 characters</span>
                      <span>• One uppercase & one lowercase letter</span>
                      <span>• One number & one special character</span>
                    </div>

                    <Button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold" isLoading={isLoading}>
                      {mode === 'forgot_password' ? 'Reset Password' : 'Activate & Enter Portal'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Step 4: Success Screen */}
              {step === 4 && (
                <div className="text-center py-6 flex flex-col items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 flex items-center justify-center shadow-md">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-950">Password Reset Success!</h2>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">
                      Your student password has been successfully updated. You can now login with your new password.
                    </p>
                  </div>
                  <Button onClick={() => setMode('login')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 mt-4">
                    Return to Login <ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          )}

        </Card>

        {/* Development Mode Testing Cards */}
        {isDev && (
          <div className="mt-8 flex flex-col gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-slate-600 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={14} /> Dev Testing Credentials
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded border border-blue-100 uppercase">
                  Seed Data
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span>Roll Number: <strong>BCA24001</strong></span>
                  <button
                    onClick={() => copyToClipboard('BCA24001', setCopiedRoll)}
                    className="p-1 rounded bg-slate-50 border border-slate-250 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    {copiedRoll ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedRoll ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Date of Birth: <strong>15-08-2005</strong></span>
                  <button
                    onClick={() => copyToClipboard('15-08-2005', setCopiedDob)}
                    className="p-1 rounded bg-slate-50 border border-slate-250 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    {copiedDob ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedDob ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pass (after activation): <strong>Test@12345</strong></span>
                  <button
                    onClick={() => copyToClipboard('Test@12345', setCopiedPass)}
                    className="p-1 rounded bg-slate-50 border border-slate-250 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    {copiedPass ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
                  <strong>Activation Flow Guide:</strong><br />
                  1. Click "Activate Account" link.<br />
                  2. Use Roll and DOB above to fetch masked email.<br />
                  3. Enter the Dev Mode OTP displayed in the card.<br />
                  4. Setup password (e.g. <code>Test@12345</code>) to activate.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default Login;
