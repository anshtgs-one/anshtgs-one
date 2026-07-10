'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setSubmitting(true);
    const { error } = await resetPassword(email);
    if (error) {
      toast.error(error);
    } else {
      setSent(true);
      toast.success('Password reset link sent to your email');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">The Gurukulam School</div>
            <div className="text-xs text-gray-500">A PhysicsWallah School</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Check Your Email</h2>
              <p className="text-sm text-gray-500">
                We&apos;ve sent a password reset link to <span className="font-medium text-gray-700">{email}</span>.
                Click the link in the email to reset your password.
              </p>
              <Button onClick={() => router.push('/login')} variant="outline" className="w-full h-11">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Forgot Password</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send you a reset link</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="you@thegurukulam.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-11 bg-blue-700 hover:bg-blue-800">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
                </Button>
              </form>

              <button
                onClick={() => router.push('/login')}
                className="mt-6 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
