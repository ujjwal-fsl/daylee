import React from 'react';
import { X, Check, LogOut } from 'lucide-react';
import { ACCENT_COLORS, HandwritingFont, PaperStyle, User, UserSettings } from '../types';
import { UserAvatar } from './UserAvatar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  user: User | null;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  user,
  onLogout,
}) => {
  if (!isOpen) return null;

  const currentAccent =
    ACCENT_COLORS.find((c) => c.id === settings.accentColorId) || ACCENT_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs font-sans">
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-2xl shadow-xl border border-[#E5DEC9] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFE8DA] bg-[#FAF6EE] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#2D2B28]">Personalize Notebook</h2>
            <p className="text-xs text-[#7A7367]">Tailor your paper, pen, and aesthetic</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#8A8478] hover:text-[#2D2B28] hover:bg-[#EFE8DA]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#2D2B28]">
          {/* Section 9.8 User Profile */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6EE] border border-[#ECE4D5]">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="md" />
              <div>
                <div className="text-sm font-semibold">{user?.name || 'Student Guest'}</div>
                <div className="text-xs text-[#7A7367]">{user?.email || 'guest@daylee.app'}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#A05244] hover:bg-[#F8EBE8] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>

          {/* Section 9.5 Paper Styles */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-[#5A5449] uppercase tracking-wider block">
              Paper Style
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'plain', name: 'Plain Paper', desc: 'Minimal cream', previewClass: 'paper-plain' },
                { id: 'ruled', name: 'Ruled Paper', desc: 'Notebook lines', previewClass: 'paper-ruled' },
                { id: 'dotgrid', name: 'Dot Grid', desc: 'Bullet journal', previewClass: 'paper-dotgrid' },
              ].map((style) => {
                const isSelected = settings.paperStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => onUpdateSettings({ paperStyle: style.id as PaperStyle })}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-24 transition-all relative overflow-hidden ${
                      isSelected
                        ? 'border-[#2D2B28] shadow-sm ring-1 ring-[#2D2B28]'
                        : 'border-[#DDD4C4] hover:border-[#B5ACA0]'
                    } ${style.previewClass}`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#2D2B28] flex items-center justify-between">
                        <span>{style.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2D2B28]" />}
                      </div>
                      <div className="text-[11px] text-[#7A7367] mt-0.5">{style.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 9.6 Handwriting Fonts */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-[#5A5449] uppercase tracking-wider block">
              Handwriting Font
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'patrick', name: 'Patrick Hand', sample: 'Chemistry notes & labs', fontClass: 'font-patrick' },
                { id: 'kalam', name: 'Kalam', sample: 'Physics problem set 4', fontClass: 'font-kalam' },
                { id: 'caveat', name: 'Caveat', sample: 'Read literature chapter 2', fontClass: 'font-caveat' },
              ].map((f) => {
                const isSelected = settings.font === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onUpdateSettings({ font: f.id as HandwritingFont })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#2D2B28] bg-white shadow-xs ring-1 ring-[#2D2B28]'
                        : 'border-[#DDD4C4] bg-[#FAF6EE] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[#5A5449]">{f.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#2D2B28]" />}
                    </div>
                    <div className={`text-base text-[#2D2B28] ${f.fontClass}`}>
                      {f.sample}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 9.7 Accent Colors */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-[#5A5449] uppercase tracking-wider block">
              Accent Color
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ACCENT_COLORS.map((accent) => {
                const isSelected = settings.accentColorId === accent.id;
                return (
                  <button
                    key={accent.id}
                    type="button"
                    onClick={() => onUpdateSettings({ accentColorId: accent.id })}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#2D2B28] bg-white ring-1 ring-[#2D2B28]'
                        : 'border-[#DDD4C4] bg-[#FAF6EE] hover:bg-white'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: accent.hex }}
                    />
                    <span className="text-xs font-medium text-[#2D2B28] truncate">{accent.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF6EE] border-t border-[#EFE8DA] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-95"
            style={{ backgroundColor: currentAccent.hex }}
          >
            Save & Return to Notebook
          </button>
        </div>
      </div>
    </div>
  );
};
