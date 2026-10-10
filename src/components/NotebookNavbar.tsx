import React from 'react';
import { Sliders, CheckCircle2, Cloud, Wifi, WifiOff } from 'lucide-react';
import { ACCENT_COLORS, User, UserSettings } from '../types';
import { UserAvatar } from './UserAvatar';

interface NotebookNavbarProps {
  user: User | null;
  settings: UserSettings;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onGoHome: () => void;
  isOffline: boolean;
  onToggleOfflineDemo: () => void;
  syncTimestamp: number;
}

export const NotebookNavbar: React.FC<NotebookNavbarProps> = ({
  user,
  settings,
  onOpenSettings,
  onOpenAuth,
  onGoHome,
  isOffline,
  onToggleOfflineDemo,
  syncTimestamp,
}) => {
  const currentAccent =
    ACCENT_COLORS.find((c) => c.id === settings.accentColorId) || ACCENT_COLORS[0];

  return (
    <header className="w-full max-w-[880px] mx-auto px-4 pt-4 pb-2 flex items-center justify-between font-sans select-none">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-2 cursor-pointer group" onClick={onGoHome}>
        <img
          src="/daylee-icon-512.png"
          alt="Daylee"
          className="w-8 h-8 object-contain shrink-0 transition-transform group-hover:scale-105 drop-shadow-2xs"
        />
        <div className="flex flex-col">
          <span className="font-patrick text-xl font-bold tracking-tight text-[#2D2B28] leading-none">
            Daylee
          </span>
          <span className="text-[10px] text-[#8E877B] tracking-tight">
            A calmer way to plan
          </span>
        </div>
      </div>

      {/* Action buttons & invisible sync indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Invisible sync indicator (Section 12 UX-006 & Section 18) */}
        {!isOffline ? (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#7A8A80] bg-[#EEF4F1] px-2.5 py-1 rounded-full border border-[#D5E4DC]">
            <CheckCircle2 className="w-3 h-3 text-[#6A8E7F]" />
            <span>Saved automatically</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-[#A05244] bg-[#FAF0ED] px-2.5 py-1 rounded-full border border-[#ECC4B8]">
            <WifiOff className="w-3 h-3" />
            <span>Read-only</span>
          </div>
        )}

        {/* Offline simulator toggle button for testing */}
        <button
          type="button"
          onClick={onToggleOfflineDemo}
          title={isOffline ? "Re-connect online" : "Simulate offline mode"}
          className={`p-1.5 rounded-xl border text-xs transition-colors ${
            isOffline
              ? 'bg-[#FBF0ED] border-[#ECC4B8] text-[#C55745]'
              : 'border-[#E2DACB] hover:bg-[#EFE8DA] text-[#7A7367]'
          }`}
        >
          {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
        </button>

        {/* Personalize Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Personalize notebook (Paper, Font, Accent)"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDD4C4] bg-[#FFFDF9] hover:bg-[#FAF6EE] text-[#4A453E] text-xs font-medium transition-colors shadow-2xs"
        >
          <Sliders className="w-3.5 h-3.5 text-[#7A7367]" />
          <span className="hidden md:inline">Personalize</span>
        </button>

        {/* Profile / Sign In Pill */}
        {user && !user.isGuest ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl border border-[#DDD4C4] bg-[#FFFDF9] hover:bg-[#FAF6EE] transition-colors"
          >
            <UserAvatar user={user} size="sm" />
            <span className="text-xs font-medium text-[#4A453E] hidden sm:inline max-w-[80px] truncate">
              {user.name.split(' ')[0]}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-xs flex items-center gap-1.5"
            style={{ backgroundColor: currentAccent.hex }}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Sign in to sync</span>
          </button>
        )}
      </div>
    </header>
  );
};
