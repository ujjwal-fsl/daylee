import React, { useState } from 'react';
import { Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { formatNotebookDate, formatNotebookYear, getTimeGreeting, isToday } from '../utils/dateUtils';
import { HandwritingFont } from '../types';

interface DateHeaderProps {
  currentDate: string;
  onPrevDate: () => void;
  onNextDate: () => void;
  onSelectToday: () => void;
  onDateChange: (dateStr: string) => void;
  font: HandwritingFont;
  accentColor: string;
}

export const DateHeader: React.FC<DateHeaderProps> = ({
  currentDate,
  onPrevDate,
  onNextDate,
  onSelectToday,
  onDateChange,
  font,
  accentColor,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { greeting, icon } = getTimeGreeting();
  const formattedDate = formatNotebookDate(currentDate);
  const yearSuffix = formatNotebookYear(currentDate);
  const isViewingToday = isToday(currentDate);

  const fontClass =
    font === 'kalam'
      ? 'font-kalam'
      : font === 'caveat'
      ? 'font-caveat text-3xl md:text-4xl'
      : 'font-patrick text-2xl md:text-3xl';

  return (
    <div className="flex flex-col items-center justify-center pt-2 pb-4 text-center select-none">
      {/* 8.2 Greeting */}
      <div className="flex items-center gap-2 text-sm md:text-base font-medium text-[#7C756B] tracking-wide mb-1">
        <span>{greeting}</span>
        <span className="text-base select-none">{icon}</span>
      </div>

      {/* 8.3 Date Navigation with Doodle Arrows */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 my-1">
        {/* Previous Day Doodle Arrow */}
        <button
          type="button"
          onClick={onPrevDate}
          aria-label="Previous day"
          className="group relative p-2 rounded-full hover:bg-[#EFE9DD]/70 active:scale-95 transition-all text-[#6B645A] hover:text-[#2D2B28]"
          title="Previous day"
        >
          {/* Hand-drawn organic arrow left */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            className="w-6 h-6 sm:w-7 sm:h-7 stroke-current stroke-[2.2] stroke-linecap-round stroke-linejoin-round transition-transform group-hover:-translate-x-0.5"
          >
            <path d="M 22 16 C 16 15.8, 11 16.2, 8 16" />
            <path d="M 14 10 C 11.5 12.5, 9.5 14.5, 8 16 C 9.5 17.5, 11.5 19.5, 14 22" />
          </svg>
        </button>

        {/* Date Display */}
        <div className="relative flex items-center justify-center">
          <div
            className={`${fontClass} font-semibold text-[#2D2B28] tracking-normal cursor-pointer hover:opacity-85 transition-opacity px-2`}
            onClick={() => setShowDatePicker(!showDatePicker)}
            title="Click to jump to date"
          >
            {formattedDate}
            {yearSuffix ? ` (${yearSuffix})` : ''}
          </div>

          {/* Quick Date Picker Dropdown */}
          {showDatePicker && (
            <div className="absolute top-full mt-2 z-30 bg-[#FFFDF9] border border-[#E5DEC9] shadow-lg rounded-xl p-3 font-sans text-left min-w-[200px]">
              <div className="text-xs font-semibold text-[#7C756B] mb-2">Jump to date:</div>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => {
                  if (e.target.value) {
                    onDateChange(e.target.value);
                    setShowDatePicker(false);
                  }
                }}
                className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-[#D8CFC0] bg-white text-[#2D2B28] focus:outline-none focus:ring-1 focus:ring-[#8E887E]"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="text-xs text-[#7C756B] hover:text-[#2D2B28] px-2 py-1"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Next Day Doodle Arrow */}
        <button
          type="button"
          onClick={onNextDate}
          aria-label="Next day"
          className="group relative p-2 rounded-full hover:bg-[#EFE9DD]/70 active:scale-95 transition-all text-[#6B645A] hover:text-[#2D2B28]"
          title="Next day"
        >
          {/* Hand-drawn organic arrow right */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            className="w-6 h-6 sm:w-7 sm:h-7 stroke-current stroke-[2.2] stroke-linecap-round stroke-linejoin-round transition-transform group-hover:translate-x-0.5"
          >
            <path d="M 10 16 C 16 15.8, 21 16.2, 24 16" />
            <path d="M 18 10 C 20.5 12.5, 22.5 14.5, 24 16 C 22.5 17.5, 20.5 19.5, 18 22" />
          </svg>
        </button>
      </div>

      {/* Return to Today Badge if navigating another day */}
      {!isViewingToday && (
        <button
          type="button"
          onClick={onSelectToday}
          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all shadow-xs border"
          style={{
            backgroundColor: `${accentColor}15`,
            borderColor: `${accentColor}40`,
            color: '#2D2B28',
          }}
        >
          <RotateCcw className="w-3 h-3" />
          <span>Back to Today</span>
        </button>
      )}
    </div>
  );
};
