import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { apiClient } from '../services/api';
import { ShieldAlert, KeyRound, Mail, ArrowRight, CheckCircle, ArrowLeft, Sparkles, Check, Briefcase } from 'lucide-react';

// Validation Schemas
const loginSchema = z.object({
  roll_number: z.string().min(3, { message: 'Enter a valid Roll Number' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const forgotSchema = z.object({
  roll_number: z.string().min(3, { message: 'Enter a valid Roll Number' }),
});

const otpSchema = z.object({
  otp_code: z.string().length(6, { message: 'OTP must be exactly 6 digits' }),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type LoginSchema = z.infer<typeof loginSchema>;
type ForgotSchema = z.infer<typeof forgotSchema>;
type OtpSchema = z.infer<typeof otpSchema>;
type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

// Motion Variants
const pageVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

const leftVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 } }
};

const rightVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const shakeVariants = {
  shake: { x: [0, -4, 4, -4, 4, 0], transition: { duration: 0.3 } }
};

const JourneyAnimation = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 5);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    { label: 'Resume optimization' },
    { label: 'AI Analysis' },
    { label: 'Skill intelligence' },
    { label: 'Personalized opportunities' },
  ];

  return (
    <div className="flex flex-col gap-6 mt-10 w-full max-w-[320px] relative">
      <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-slate-100" />
      {steps.map((s, i) => {
        const isPast = step > i;
        const isCurrent = step === i;
        const isFuture = step < i;

        return (
          <div key={i} className="flex items-center gap-5 relative z-10">
            <motion.div
              className={`w-6 h-6 rounded-full border-[2px] flex items-center justify-center shrink-0 bg-white transition-colors duration-500 ${
                isPast ? 'border-[#0F5132] text-[#0F5132]' : isCurrent ? 'border-[#0F5132] text-[#0F5132]' : 'border-slate-200 text-slate-300'
              }`}
              animate={{ scale: isCurrent ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {isPast ? <Check size={12} strokeWidth={3.5} /> : isCurrent ? <div className="w-2 h-2 rounded-full bg-[#0F5132]" /> : null}
            </motion.div>
            <motion.span 
              className={`text-[14px] font-semibold transition-colors duration-500 ${isPast || isCurrent ? 'text-slate-800' : 'text-slate-400'}`}
              animate={{ opacity: isFuture ? 0.6 : 1, x: isCurrent ? 4 : 0 }}
            >
              {s.label}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
};

export const Login: React.FC = () => {
  const { login: storeLogin } = useUserStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');
  const [step, setStep] = useState(1);
  const [rollNumber, setRollNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  const loginForm = useForm<LoginSchema>({ resolver: zodResolver(loginSchema) });
  const forgotForm = useForm<ForgotSchema>({ resolver: zodResolver(forgotSchema) });
  const otpForm = useForm<OtpSchema>({ resolver: zodResolver(otpSchema) });
  const resetForm = useForm<ResetPasswordSchema>({ resolver: zodResolver(resetPasswordSchema) });

  const isDev = import.meta.env.DEV;

  useEffect(() => {
    setApiError(null);
    setStep(1);
  }, [mode]);

  const handleLogin = async (data: LoginSchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      await storeLogin(data);
      setAuthSuccess(true);
      setTimeout(() => navigate('/dashboard'), 700);
    } catch (err: any) {
      setApiError(useUserStore.getState().error || 'Incorrect Roll Number or Password.');
      setIsLoading(false);
    }
  };

  const handleVerifyForgot = async (data: ForgotSchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await apiClient.post('/api/auth/forgot-password', data);
      setRollNumber(data.roll_number);
      setStudentName(response.data.student_name);
      setMaskedEmail(response.data.email);
      if (response.data.dev_otp) setDevOtp(response.data.dev_otp);
      setStep(2);
    } catch (err: any) {
      setApiError(err.message || 'Roll Number not found or inactive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (data: OtpSchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      await apiClient.post('/api/auth/forgot-password/verify-otp', {
        roll_number: rollNumber,
        otp_code: data.otp_code,
        purpose: 'forgot_password'
      });
      setStep(3);
    } catch (err: any) {
      setApiError(err.message || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordSchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      await apiClient.post('/api/auth/forgot-password/reset', {
        roll_number: rollNumber,
        password: data.password
      });
      setStep(4);
    } catch (err: any) {
      setApiError(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen flex items-center justify-center relative font-sans bg-[#FAFBFC] overflow-hidden"
    >
      {/* 12. BACKGROUND - Subtle geometric grid/dots */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(#0A192F 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 gap-12 lg:gap-24 relative z-10">
        
        {/* LEFT COLUMN: Minimal Bimba AI Career Visualization */}
        <motion.div 
          variants={leftVariants}
          className="hidden lg:flex flex-col w-full max-w-sm shrink-0"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#0A192F] flex items-center justify-center text-white shadow-sm">
              <Sparkles size={20} color="white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Bimba AI
            </h1>
          </div>
          
          <h2 className="text-[32px] font-light text-slate-800 leading-[1.15] tracking-tight mb-3">
            Build your career<br />
            <strong className="font-semibold text-slate-900">with intelligence.</strong>
          </h2>
          
          <p className="text-[15px] text-slate-500 font-medium mb-4">
            Your career journey starts here.
          </p>

          <JourneyAnimation />
        </motion.div>

        {/* RIGHT COLUMN: The Login Form */}
        <motion.div 
          variants={rightVariants}
          className="w-full max-w-[420px]"
        >
          {/* Back button above card */}
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-1.5 text-[12px] font-bold text-slate-400 hover:text-slate-800 mb-5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-md px-1 py-0.5 -ml-1"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" /> Back
          </button>

          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.3 } }}
            className="w-full"
          >
            <Card className="w-full bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/60 transition-shadow duration-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.05)]">
              
              {/* Mobile Header (Hidden on Desktop) */}
              <div className="flex flex-col items-center mb-8 lg:hidden">
                <motion.div 
                  className="w-12 h-12 rounded-2xl bg-[#0A192F] flex items-center justify-center text-white mb-4 shadow-sm"
                  initial={{ scale: 0.85 }}
                  animate={{ scale: isFocused ? 1.05 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Sparkles size={20} color="white" />
                </motion.div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Bimba AI
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.08em] mt-1">
                  Student Placement Portal
                </p>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:flex flex-col mb-8">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.08em] mb-1">
                  Student Placement Portal
                </p>
              </div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col w-full"
              >
                <AnimatePresence mode="wait">
                  {apiError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100 text-[13px] font-medium text-red-700 flex items-start gap-2.5">
                        <ShieldAlert size={18} className="shrink-0 text-red-500 mt-0.5" />
                        <span className="leading-snug">{apiError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CARD 1: LOGIN */}
                {mode === 'login' && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                    <motion.div variants={itemVariants} className="mb-7 text-center lg:text-left">
                      <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                      <p className="text-[13.5px] text-slate-500 mt-1.5 leading-relaxed">Access your academic placements<br className="hidden lg:block"/> and optimized resumes</p>
                    </motion.div>

                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="flex flex-col gap-4">
                      <motion.div variants={itemVariants} animate={loginForm.formState.errors.roll_number ? "shake" : ""} variants={shakeVariants}>
                        <Input
                          id="roll_number"
                          label="Roll Number"
                          type="text"
                          placeholder="e.g. BCA24001"
                          error={loginForm.formState.errors.roll_number?.message}
                          className="transition-all duration-200 focus:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus:-translate-y-[1px] bg-[#F9FAFB] focus:bg-white border-slate-200"
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          {...loginForm.register('roll_number')}
                        />
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="flex flex-col gap-1" animate={loginForm.formState.errors.password ? "shake" : ""} variants={shakeVariants}>
                        <Input
                          id="password"
                          label="Password"
                          type="password"
                          placeholder="••••••••"
                          error={loginForm.formState.errors.password?.message}
                          className="transition-all duration-200 focus:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus:-translate-y-[1px] bg-[#F9FAFB] focus:bg-white border-slate-200"
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          {...loginForm.register('password')}
                        />
                        <div className="flex justify-between items-center mt-3">
                          <label className="flex items-center gap-2 text-[13px] font-medium text-slate-500 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                className="peer w-4 h-4 rounded border-slate-300 text-[#0F5132] focus:ring-[#0F5132] focus:ring-offset-1 transition-colors cursor-pointer"
                              />
                            </div>
                            <span className="group-hover:text-slate-800 transition-colors">Remember Me</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setMode('forgot_password')}
                            className="text-[13px] font-semibold text-slate-600 hover:text-[#0F5132] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded px-1 -mx-1"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="mt-4">
                        <Button 
                          type="submit" 
                          className="w-full bg-[#0F5132] hover:bg-[#146c43] text-white font-medium py-[14px] text-[15px] rounded-xl transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(15,81,50,0.15)] flex items-center justify-center gap-2 group"
                          disabled={isLoading || authSuccess}
                        >
                          {authSuccess ? (
                            <>
                              <CheckCircle size={18} className="animate-in zoom-in duration-300" />
                              <span>Welcome Back</span>
                            </>
                          ) : isLoading ? (
                            <>
                              <div className="w-4 h-4 border-[2px] border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Authenticating...</span>
                            </>
                          ) : (
                            <>
                              <span>Log In</span>
                              <ArrowRight size={16} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </motion.div>
                )}

                {/* CARD 2: FORGOT PASSWORD WIZARD */}
                {mode === 'forgot_password' && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                    {step < 4 && (
                      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8 px-2">
                        {[1, 2, 3].map((s) => (
                          <div key={s} className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                                step >= s ? 'bg-[#0F5132] text-white shadow-md shadow-[#0F5132]/10' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {step > s ? <Check size={14} strokeWidth={3} /> : s}
                            </div>
                            {s < 3 && <div className={`w-12 h-[2px] transition-colors duration-300 rounded-full ${step > s ? 'bg-[#0F5132]' : 'bg-slate-100'}`} />}
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                      <motion.div variants={containerVariants} initial="hidden" animate="show">
                        <motion.div variants={itemVariants} className="mb-7 text-center lg:text-left">
                          <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Reset Password</h2>
                          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                            Enter your Roll Number to trigger verification OTP
                          </p>
                        </motion.div>

                        <form onSubmit={forgotForm.handleSubmit(handleVerifyForgot)} className="flex flex-col gap-5">
                          <motion.div variants={itemVariants}>
                            <Input
                              id="roll_number"
                              label="Roll Number"
                              type="text"
                              placeholder="e.g. BCA24001"
                              error={forgotForm.formState.errors.roll_number?.message}
                              className="transition-all duration-200 focus:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus:-translate-y-[1px] bg-[#F9FAFB] focus:bg-white"
                              {...forgotForm.register('roll_number')}
                            />
                          </motion.div>

                          <motion.div variants={itemVariants} className="flex gap-3 mt-2">
                            <button
                              type="button"
                              onClick={() => setMode('login')}
                              className="w-1/2 py-[13px] rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                              Cancel
                            </button>
                            <Button 
                              type="submit" 
                              className="w-1/2 bg-[#0F5132] hover:bg-[#146c43] text-white font-medium py-[13px] rounded-xl transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(15,81,50,0.15)]"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                              ) : "Continue"}
                            </Button>
                          </motion.div>
                        </form>
                      </motion.div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                      <motion.div variants={containerVariants} initial="hidden" animate="show">
                        <motion.div variants={itemVariants} className="mb-7 text-center lg:text-left">
                          <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Verification Code</h2>
                          <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                            Hi <strong className="text-slate-800 font-semibold">{studentName}</strong>, a code was sent to<br />
                            <span className="font-semibold text-slate-700">{maskedEmail}</span>
                          </p>
                        </motion.div>

                        {isDev && devOtp && (
                          <motion.div variants={itemVariants} className="mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] text-slate-600 font-medium flex items-center gap-2 shadow-sm">
                            <Sparkles size={14} className="text-amber-500" />
                            <span>Dev OTP: <strong className="text-slate-900 font-bold tracking-widest">{devOtp}</strong></span>
                          </motion.div>
                        )}

                        <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="flex flex-col gap-5">
                          <motion.div variants={itemVariants}>
                            <Input
                              id="otp_code"
                              label="6-Digit OTP Code"
                              type="text"
                              placeholder="••••••"
                              className="text-center tracking-[0.5em] text-lg font-bold transition-all duration-200 focus:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus:-translate-y-[1px] bg-[#F9FAFB] focus:bg-white"
                              error={otpForm.formState.errors.otp_code?.message}
                              {...otpForm.register('otp_code')}
                            />
                          </motion.div>

                          <motion.div variants={itemVariants} className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setStep(1)}
                              className="w-1/2 py-[13px] rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                              Back
                            </button>
                            <Button 
                              type="submit" 
                              className="w-1/2 bg-[#0F5132] hover:bg-[#146c43] text-white font-medium py-[13px] rounded-xl transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(15,81,50,0.15)]"
                              disabled={isLoading}
                            >
                              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Verify"}
                            </Button>
                          </motion.div>
                        </form>
                      </motion.div>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                      <motion.div variants={containerVariants} initial="hidden" animate="show">
                        <motion.div variants={itemVariants} className="mb-7 text-center lg:text-left">
                          <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">New Password</h2>
                          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                            Create a secure password for your account.
                          </p>
                        </motion.div>

                        <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="flex flex-col gap-4">
                          <motion.div variants={itemVariants}>
                            <Input
                              id="password"
                              label="New Password"
                              type="password"
                              placeholder="••••••••"
                              error={resetForm.formState.errors.password?.message}
                              className="transition-all duration-200 focus:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus:-translate-y-[1px] bg-[#F9FAFB] focus:bg-white"
                              {...resetForm.register('password')}
                            />
                          </motion.div>
                          
                          <motion.div variants={itemVariants}>
                            <Input
                              id="confirm_password"
                              label="Confirm Password"
                              type="password"
                              placeholder="••••••••"
                              error={resetForm.formState.errors.confirm_password?.message}
                              className="transition-all duration-200 focus:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus:-translate-y-[1px] bg-[#F9FAFB] focus:bg-white"
                              {...resetForm.register('confirm_password')}
                            />
                          </motion.div>

                          <motion.div variants={itemVariants} className="text-[11.5px] text-slate-400 flex flex-col gap-1 mt-1 px-1">
                            <span>• Minimum 8 characters</span>
                          </motion.div>

                          <motion.div variants={itemVariants} className="mt-2">
                            <Button 
                              type="submit" 
                              className="w-full bg-[#0F5132] hover:bg-[#146c43] text-white font-medium py-[14px] rounded-xl transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(15,81,50,0.15)]"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                              ) : "Reset Password"}
                            </Button>
                          </motion.div>
                        </form>
                      </motion.div>
                    )}

                    {/* Step 4: Success Screen */}
                    {step === 4 && (
                      <motion.div variants={containerVariants} initial="hidden" animate="show" className="text-center py-6 flex flex-col items-center gap-6">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="w-16 h-16 bg-[#0F5132]/5 text-[#0F5132] rounded-full border border-[#0F5132]/10 flex items-center justify-center"
                        >
                          <CheckCircle size={32} />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Success!</h2>
                          <p className="text-[13.5px] text-slate-500 mt-2 leading-relaxed max-w-[240px] mx-auto">
                            Your password has been successfully updated.
                          </p>
                        </motion.div>
                        <motion.div variants={itemVariants} className="w-full mt-4">
                          <Button 
                            onClick={() => { setMode('login'); setStep(1); }} 
                            className="w-full bg-[#0F5132] hover:bg-[#146c43] text-white font-medium py-[14px] rounded-xl transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(15,81,50,0.15)] flex items-center justify-center gap-2 group"
                          >
                            Return to Login
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};
export default Login;
