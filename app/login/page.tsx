'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth, ROLE_DASHBOARD_MAP } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, session, profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && session && profile) {
      const dashboard = ROLE_DASHBOARD_MAP[profile.role] || '/dashboard';
      router.replace(dashboard);
    }
  }, [session, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error);
      setSubmitting(false);
    } else {
      toast.success('Welcome back!');
      // Immediate redirect to dashboard to ensure user lands on the app.
      // AuthProvider will still refresh profile in background and adjust role-based routing.
      try {
        router.replace('/dashboard');
      } catch (e) {
        // ignore
      }
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
              <GraduationCap className="h-7 w-7 text-blue-700" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">The Gurukulam School</div>
              <div className="text-xs text-blue-200">A PhysicsWallah School</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Central Marketing<br />Workspace
          </h1>
          <p className="text-blue-200 text-lg max-w-md">
            Manage campaigns, track admissions, monitor budgets, and coordinate marketing operations across all school locations.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div>
              <div className="text-3xl font-bold text-white">12</div>
              <div className="text-xs text-blue-200">Schools</div>
            </div>
            <div className="w-px h-12 bg-blue-400/30" />
            <div>
              <div className="text-3xl font-bold text-white">4,200+</div>
              <div className="text-xs text-blue-200">Admissions Target</div>
            </div>
            <div className="w-px h-12 bg-blue-400/30" />
            <div>
              <div className="text-3xl font-bold text-white">₹2.5Cr</div>
              <div className="text-xs text-blue-200">Annual Budget</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-300">
          © 2026 The Gurukulam School. All rights reserved.
        </div>
      </div>

      {/* Right side — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">The Gurukulam School</div>
              <div className="text-xs text-gray-500">A PhysicsWallah School</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your Central Marketing Workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@thegurukulam.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <button
                  type="button"
                  onClick={() => router.push('/auth/forgot-password')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">Remember me</Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full h-11 border-gray-200 hover:bg-gray-50"
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Google
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-8 rounded-lg bg-blue-50 border border-blue-100 p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-semibold mb-1">Demo Credentials:</p>
                <p>Admin: admin@thegurukulam.in / TGS@2026</p>
                <p>Central: central@thegurukulam.in / TGS@2026</p>
                <p>SIG: sig@thegurukulam.in / TGS@2026</p>
                <p className="mt-1 text-blue-500">All passwords: TGS@2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
