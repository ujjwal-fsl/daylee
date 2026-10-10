import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';
import { User } from '../types';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
} from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

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
      onSuccess(user);
      onClose();
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
      setError('Please fill in both email and password.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setIsLoading(true);
    try {
      let fbUser;
      if (mode === 'register') {
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

      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(mapFirebaseError(err?.code) || err?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs font-sans">
      <div className="w-full max-w-sm bg-[#FFFDF9] rounded-2xl shadow-xl border border-[#E5DEC9] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFE8DA] bg-[#FAF6EE]">
          <div className="flex items-center gap-2">
            <img
              src="/daylee-icon-512.png"
              alt="Daylee"
              className="w-6 h-6 object-contain shrink-0"
            />
            <span className="text-sm font-semibold text-[#2D2B28]">
              {mode === 'login' ? 'Sign In to Your Notebook' : 'Create Daylee Account'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#8A8478] hover:text-[#2D2B28] hover:bg-[#EFE8DA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-[#2D2B28]">
          {/* Cloud Sync Announcement */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F9EDE9] border border-[#E8BDB2] text-[#704331] text-xs">
            <Sparkles className="w-4 h-4 shrink-0 text-[#A9472F] mt-0.5" />
            <p className="leading-snug">
              Sign in with Google or Email to sync all notebook tasks seamlessly across all your devices.
            </p>
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
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-[#DDD4C4] bg-white hover:bg-[#FAF6EE] text-[#3A352D] text-xs font-medium shadow-2xs transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
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
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#5A5449]">Your Name</label>
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
              className="w-full py-2.5 rounded-xl bg-[#A9472F] hover:bg-[#933D27] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 mt-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading
                ? 'Connecting...'
                : mode === 'login'
                ? 'Sign In to Notebook'
                : 'Create Account'}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center pt-2 text-xs text-[#7A7367]">
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[#A9472F] font-semibold hover:underline cursor-pointer"
                >
                  Create one
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#A9472F] font-semibold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
