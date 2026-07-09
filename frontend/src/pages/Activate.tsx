import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle, ShieldAlert, Sparkles, KeyRound, Mail, ArrowRight } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { apiClient } from '../services/api';

// Validation Schemas
const verifySchema = z.object({
  roll_number: z.string().min(3, { message: 'Enter a valid Roll Number' }),
  date_of_birth: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, { message: 'Date of Birth must be in format DD-MM-YYYY' }),
});

const otpSchema = z.object({
  otp_code: z.string().length(6, { message: 'OTP must be exactly 6 digits' }),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirm_password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type VerifySchema = z.infer<typeof verifySchema>;
type OtpSchema = z.infer<typeof otpSchema>;
type PasswordSchema = z.infer<typeof passwordSchema>;

export const Activate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('mode') === 'reset';

  // Step states: 1 = Verify, 2 = OTP, 3 = Password, 4 = Success
  const [step, setStep] = useState(1);
  const [rollNumber, setRollNumber] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forms
  const verifyForm = useForm<VerifySchema>({ resolver: zodResolver(verifySchema) });
  const otpForm = useForm<OtpSchema>({ resolver: zodResolver(otpSchema) });
  const passwordForm = useForm<PasswordSchema>({ resolver: zodResolver(passwordSchema) });

  const handleVerify = async (data: VerifySchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const endpoint = isResetMode ? '/api/auth/forgot-password/verify' : '/api/auth/activation/verify';
      const response = await apiClient.post(endpoint, data);
      
      setRollNumber(data.roll_number);
      setPersonalEmail(response.data.email);
      if (response.data.dev_otp) {
        setDevOtp(response.data.dev_otp);
      }
      setStep(2);
    } catch (err: any) {
      setApiError(err.response?.data?.detail || 'Verification failed. Double check your Roll Number and Date of Birth.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (data: OtpSchema) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const endpoint = isResetMode ? '/api/auth/forgot-password/verify-otp' : '/api/auth/activation/verify-otp';
      await apiClient.post(endpoint, {
        roll_number: rollNumber,
        otp_code: data.otp_code,
        purpose: isResetMode ? 'forgot_password' : 'activation'
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
      const endpoint = isResetMode ? '/api/auth/forgot-password/reset' : '/api/auth/activation/setup-password';
      await apiClient.post(endpoint, {
        roll_number: rollNumber,
        password: data.password
      });
      setStep(4);
    } catch (err: any) {
      setApiError(err.response?.data?.detail || 'Failed to setup password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-400/10 blur-[100px] z-0" />
      <Card className="w-full max-w-md relative z-10 p-8">
        
        {/* Step Indicator */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-smooth ${
                    step >= s ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-slate-150'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Global API Error Alert */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Step 1: Verify Identity */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-slate-800">
                {isResetMode ? 'Reset Password' : 'Activate Account'}
              </h2>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                {isResetMode 
                  ? 'Verify your identity to reset your student profile password' 
                  : 'Enter your credentials as added by placement admin to activate'}
              </p>
            </div>

            <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="flex flex-col gap-5">
              <Input
                id="roll_number"
                label="Roll Number"
                placeholder="e.g. BCA25008"
                error={verifyForm.formState.errors.roll_number?.message}
                {...verifyForm.register('roll_number')}
              />
              <Input
                id="date_of_birth"
                label="Date of Birth"
                placeholder="DD-MM-YYYY"
                helperText="Enter in format: Day-Month-Year (e.g. 29-05-2007)"
                error={verifyForm.formState.errors.date_of_birth?.message}
                {...verifyForm.register('date_of_birth')}
              />
              <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                Verify Identity
              </Button>
            </form>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={22} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Enter OTP Code</h2>
              <p className="text-sm text-slate-400 mt-1">
                A 6-digit passcode has been sent to your personal email address: <br />
                <span className="font-semibold text-slate-700">{personalEmail}</span>
              </p>
            </div>

            {/* Dev Helper Callout */}
            {devOtp && (
              <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-primary font-medium flex items-center gap-2">
                <Sparkles size={16} />
                <span>Dev Tip: Use OTP <strong className="text-blue-700 font-extrabold">{devOtp}</strong></span>
              </div>
            )}

            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="flex flex-col gap-5">
              <Input
                id="otp_code"
                label="OTP Verification Code"
                placeholder="123456"
                type="text"
                error={otpForm.formState.errors.otp_code?.message}
                {...otpForm.register('otp_code')}
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Verify Code
              </Button>
            </form>
          </div>
        )}

        {/* Step 3: Setup Password */}
        {step === 3 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound size={22} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Create Password</h2>
              <p className="text-sm text-slate-400 mt-1">
                Setup a secure password to access your dashboard in future logins
              </p>
            </div>

            <form onSubmit={passwordForm.handleSubmit(handleSetupPassword)} className="flex flex-col gap-5">
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
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={passwordForm.formState.errors.confirm_password?.message}
                {...passwordForm.register('confirm_password')}
              />
              <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                Submit & Setup
              </Button>
            </form>
          </div>
        )}

        {/* Step 4: Success Redirection */}
        {step === 4 && (
          <div className="text-center py-6 flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-md">
              <CheckCircle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">
                {isResetMode ? 'Password Reset!' : 'Activation Success!'}
              </h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
                {isResetMode 
                  ? 'Your password has been successfully updated. You can now login with your new password.'
                  : 'Your student account is now active and ready. You can now login to build your placement profile.'}
              </p>
            </div>
            <Button onClick={() => navigate('/login')} className="w-full gap-2 mt-4">
              Return to Login <ArrowRight size={16} />
            </Button>
          </div>
        )}

      </Card>
    </div>
  );
};
export default Activate;
