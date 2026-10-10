import React, { useState } from 'react';
import { Feather, ArrowRight, Sparkles, User as UserIcon, Mail, Lock } from 'lucide-react';
import { User } from '../types';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
} from '../services/firebase';

interface LandingPageProps {
  onLoginSuccess: (user: User) => void;
  onEnterGuestDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginSuccess,
  onEnterGuestDemo,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mapFirebaseError = (errCode: string): string => {
    switch (errCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect email or password.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return '';
      default:
        return 'Authentication failed. Please check your details and try again.';
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const fbUser = await signInWithGoogle();
      const photo = fbUser.photoURL || fbUser.providerData?.[0]?.photoURL;
      const user: User = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Daylee User',
        email: fbUser.email || '',
        avatar: photo || undefined,
        isGuest: false,
      };
      onLoginSuccess(user);
    } catch (err: any) {
      const msg = mapFirebaseError(err?.code);
      if (msg) setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide your email and password.');
      return;
    }

    if (authMode === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setIsLoading(true);
    try {
      let fbUser;
      if (authMode === 'register') {
        fbUser = await registerWithEmail(email, password, name);
      } else {
        fbUser = await signInWithEmail(email, password);
      }

      const photo = fbUser.photoURL || fbUser.providerData?.[0]?.photoURL;
      const user: User = {
        id: fbUser.uid,
        name: fbUser.displayName || name.trim() || fbUser.email?.split('@')[0] || 'Daylee User',
        email: fbUser.email || '',
        avatar: photo || undefined,
        isGuest: false,
      };

      onLoginSuccess(user);
    } catch (err: any) {
      setError(mapFirebaseError(err?.code) || err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#2D2B28] flex flex-col font-sans selection:bg-[#E5DEC9]">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/daylee-icon-512.png"
            alt="Daylee"
            className="w-8 h-8 object-contain shrink-0 drop-shadow-2xs"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight font-patrick text-[#2D2B28]">
              Daylee
            </span>
            <span className="text-[10px] text-[#8E877B] tracking-tight">
              A calmer way to plan
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onEnterGuestDemo}
            className="text-xs font-medium text-[#6A8E7F] hover:text-[#527164] underline underline-offset-4 cursor-pointer"
          >
            Explore Demo as Guest
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-6 md:py-12 flex flex-col items-center text-center">
        {/* Calm Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EBE4D5] text-[#5A5449] text-xs font-medium mb-5">
          <Feather className="w-3.5 h-3.5 text-[#6A8E7F]" />
          <span>Notebook-Inspired Daily Planner for Students</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#2D2B28] max-w-2xl leading-[1.15]">
          A calmer way to plan.
        </h1>

        <p className="mt-3 text-base sm:text-lg text-[#6E675B] max-w-xl leading-relaxed">
          Sign in to your notebook to automatically sync all your daily tasks, handwritten notes, and schedules across your phone, laptop, and tablet.
        </p>

        {/* Central Auth Notebook Card */}
        <div className="mt-8 w-full max-w-md bg-[#FFFDF9] rounded-2xl md:rounded-3xl shadow-[0_12px_36px_rgb(0,0,0,0.08)] border border-[#E5DEC9] overflow-hidden text-left relative">
          {/* Notebook Binding Stitch effect */}
          <div className="h-1.5 bg-[#6A8E7F]/60 w-full" />

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-[#EFE8DA] bg-[#FAF6EE]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
              className={`flex-1 py-3 text-xs font-semibold text-center transition-colors cursor-pointer ${
                authMode === 'login'
                  ? 'text-[#2D2B28] border-b-2 border-[#6A8E7F] bg-[#FFFDF9]'
                  : 'text-[#8A8478] hover:text-[#2D2B28]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
              }}
              className={`flex-1 py-3 text-xs font-semibold text-center transition-colors cursor-pointer ${
                authMode === 'register'
                  ? 'text-[#2D2B28] border-b-2 border-[#6A8E7F] bg-[#FFFDF9]'
                  : 'text-[#8A8478] hover:text-[#2D2B28]'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Sync Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#EEF4F1] border border-[#D5E4DC] text-[#2D4E41] text-xs">
              <Sparkles className="w-4 h-4 shrink-0 text-[#6A8E7F] mt-0.5" />
              <div className="leading-snug">
                <strong className="font-semibold">Cloud Sync Active:</strong> Your tasks, categories, and handwritten styles automatically sync across all logged-in devices.
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-[#FBF0ED] border border-[#ECC4B8] text-[#C55745] text-xs">
                {error}
              </div>
            )}

            {/* Single Google Sign-In Action */}
            <div className="w-full flex flex-col items-center">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-[#DDD4C4] bg-white hover:bg-[#FAF6EE] text-[#3A352D] text-sm font-medium shadow-2xs transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[#9E978C] text-[11px]">
              <div className="flex-1 h-[1px] bg-[#EAE3D5]" />
              <span>or with email</span>
              <div className="flex-1 h-[1px] bg-[#EAE3D5]" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#5A5449]">Student Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#9E978C]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan Lee"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DDD4C4] bg-white text-[#2D2B28] focus:outline-none focus:ring-1 focus:ring-[#8E887E]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#5A5449]">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#9E978C]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@student.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DDD4C4] bg-white text-[#2D2B28] focus:outline-none focus:ring-1 focus:ring-[#8E887E]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#5A5449]">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#9E978C]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DDD4C4] bg-white text-[#2D2B28] focus:outline-none focus:ring-1 focus:ring-[#8E887E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#6A8E7F] hover:bg-[#5D8072] text-white text-xs font-semibold shadow-xs transition-all active:scale-98 mt-1 disabled:opacity-60 cursor-pointer"
              >
                {isLoading
                  ? 'Opening Notebook...'
                  : authMode === 'login'
                  ? 'Sign In to Notebook'
                  : 'Create Your Notebook'}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onEnterGuestDemo}
                className="text-xs text-[#7A7367] hover:text-[#2D2B28] inline-flex items-center gap-1 group cursor-pointer"
              >
                <span>Preview sample notebook without signing in</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Notebook Mockup Preview */}
        <div className="mt-12 w-full max-w-2xl bg-[#FDFCF8] rounded-2xl md:rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.08)] border border-[#EAE3D5] p-6 sm:p-8 text-left paper-ruled relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-12 w-[1.5px] bg-[#E8A5A5]/35 hidden sm:block pointer-events-none" />

          <div className="sm:pl-10">
            <div className="text-xs font-semibold text-[#8A8478] tracking-wide mb-1">
              Good Morning ☀️
            </div>
            <div className="font-patrick text-2xl sm:text-3xl font-bold text-[#2D2B28] flex items-center justify-between pb-3">
              <span>← Today's Tasks →</span>
              <span className="text-xs font-sans font-normal px-2.5 py-1 rounded-full bg-[#6A8E7F]/15 text-[#2D4E41]">
                Ruled Paper
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-lg font-patrick text-[#2D2B28]">
                <span className="w-5 h-5 rounded-md border-2 border-[#6A8E7F] flex items-center justify-center text-xs text-[#6A8E7F] font-bold">
                  ✓
                </span>
                <span className="text-[#8E887E] line-through">Review Physics Chapter 4 formulas</span>
                <span className="text-[11px] font-sans text-[#7A7367] ml-auto">● Study</span>
              </div>

              <div className="flex items-center gap-3 text-lg font-patrick text-[#2D2B28]">
                <span className="w-5 h-5 rounded-md border-2 border-[#8E887E]"></span>
                <span>Calculus problem set #3</span>
                <span className="text-[11px] font-sans text-[#7A7367] ml-auto">● Study</span>
              </div>

              <div className="flex items-center gap-3 text-lg font-patrick text-[#2D2B28]">
                <span className="w-5 h-5 rounded-md border-2 border-[#8E887E]"></span>
                <span>Read 20 pages of classic novel</span>
                <span className="text-[11px] font-sans text-[#7A7367] ml-auto">● Reading</span>
              </div>

              <div className="pt-2 border-b border-[#D8CFC0]/60 pb-1 text-[#9E978C] font-patrick text-base italic">
                _____________________________________ Write today's task...
              </div>
            </div>
          </div>
        </div>

        {/* 3 Calming Pillars */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-5 rounded-2xl bg-[#FFFDF9]/80 border border-[#E8E1D2] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#6A8E7F]/15 text-[#2D4E41] flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-semibold text-[#2D2B28] text-base">Handwriting & Paper</h3>
            <p className="text-xs text-[#6E675B] leading-relaxed">
              Choose from authentic handwriting fonts (Patrick Hand, Kalam, Caveat) and gentle paper textures (Ruled, Dot Grid, Plain).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFDF9]/80 border border-[#E8E1D2] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#5B879E]/15 text-[#2C4E61] flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-semibold text-[#2D2B28] text-base">Multi-Device Cloud Sync</h3>
            <p className="text-xs text-[#6E675B] leading-relaxed">
              Sign in with your Google or Email account on any device. Your tasks and custom categories stay synced everywhere in real-time.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFDF9]/80 border border-[#E8E1D2] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#8A7BA5]/15 text-[#443460] flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-semibold text-[#2D2B28] text-base">Virtual Daily Pages</h3>
            <p className="text-xs text-[#6E675B] leading-relaxed">
              Every calendar day is an independent daily page. Flip back and forth with hand-drawn doodle arrows without cluttering today.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-8 border-t border-[#EAE3D5] text-center text-xs text-[#8A8478] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-serif italic text-sm text-[#5C564B]">
          <span>Daylee — A calmer way to plan.</span>
        </div>
        <div>Crafted for students who love planning with pen and paper.</div>
      </footer>
    </div>
  );
};
