import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { HandwritingFont } from '../types';

interface EmptyNotebookStateProps {
  font: HandwritingFont;
  isSearchActive: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
  isWelcomeState?: boolean;
  accentColor?: string;
  onAddFirstTask?: () => void;
}

export const EmptyNotebookState: React.FC<EmptyNotebookStateProps> = ({
  font,
  isSearchActive,
  searchQuery,
  onClearSearch,
  isWelcomeState = false,
  accentColor = '#A9472F',
  onAddFirstTask,
}) => {
  const fontClass =
    font === 'kalam'
      ? 'font-kalam text-xl sm:text-2xl'
      : font === 'caveat'
      ? 'font-caveat text-2xl sm:text-3xl'
      : 'font-patrick text-xl sm:text-2xl';

  if (isSearchActive) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-[#EFE8DA]/80 flex items-center justify-center text-[#8E877B] mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p className="text-[#5A5449] font-medium text-sm">
          No tasks found matching "{searchQuery}"
        </p>
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-2 text-xs hover:underline font-medium cursor-pointer"
          style={{ color: accentColor }}
        >
          Clear search
        </button>
      </div>
    );
  }

  if (isWelcomeState) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none">
        <div className="w-full max-w-sm p-6 sm:p-7 rounded-2xl bg-[#FAF6EE]/90 border border-[#E4DCCD] shadow-2xs">
          {/* Star / Sparkle icon */}
          <div
            className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
          >
            <Sparkles className="w-5 h-5" />
          </div>

          <h3 className="text-xl sm:text-2xl font-serif text-[#2D2B28] font-medium tracking-tight">
            Welcome to Daylee ✦
          </h3>

          <p className="text-xs sm:text-sm text-[#6E675B] font-sans mt-2 leading-relaxed">
            Your notebook is ready. Start by adding your first task, note, or schedule.
          </p>

          <button
            type="button"
            id="btn-add-first-task"
            onClick={onAddFirstTask}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-white shadow-2xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Task</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center select-none">
      {/* Hand-drawn organic plant sprout/leaf doodle */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        className="text-[#9E9688] mb-3 stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round opacity-75"
      >
        {/* Pot / Earth */}
        <path d="M 22 52 C 27 54, 37 54, 42 52 C 40 45, 41 38, 42 34 L 22 34 C 23 38, 24 45, 22 52 Z" />
        {/* Stem */}
        <path d="M 32 34 C 32 26, 33 18, 32 12" />
        {/* Left leaf */}
        <path d="M 32 26 C 24 25, 20 18, 22 13 C 27 15, 30 20, 32 26 Z" />
        {/* Right leaf */}
        <path d="M 32 20 C 40 19, 44 12, 42 7 C 37 9, 34 14, 32 20 Z" />
      </svg>

      {/* 14 UX States Empty State requirement */}
      <p className={`text-[#6E675B] ${fontClass} max-w-xs leading-snug`}>
        Nothing here yet.
      </p>
      <p className="text-xs text-[#8E877B] font-sans mt-1">
        Write your first task for today.
      </p>
    </div>
  );
};
