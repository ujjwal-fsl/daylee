import React, { useState, useRef } from 'react';
import { Plus, Repeat, ChevronDown, Check } from 'lucide-react';
import { Category, HandwritingFont, RepeatRule, RepeatType } from '../types';
import { parseDateString } from '../utils/dateUtils';

interface TaskInputProps {
  currentDate: string;
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onAddTask: (text: string, categoryId: string, repeatRule?: RepeatRule) => void;
  font: HandwritingFont;
  accentColor: string;
  isOffline?: boolean;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TaskInput: React.FC<TaskInputProps> = ({
  currentDate,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddTask,
  font,
  accentColor,
  isOffline = false,
}) => {
  const [text, setText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [everyXDays, setEveryXDays] = useState<number>(2);
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([1, 3, 5]); // default Mon, Wed, Fri

  const fontClass =
    font === 'kalam'
      ? 'font-kalam text-lg sm:text-xl'
      : font === 'caveat'
      ? 'font-caveat text-xl sm:text-2xl'
      : 'font-patrick text-lg sm:text-xl';

  const currentCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];

  const isSubmittingRef = useRef(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingRef.current) return;
    const taskText = text.trim();
    if (!taskText || isOffline) return;

    isSubmittingRef.current = true;

    let rule: RepeatRule | undefined = undefined;
    if (repeatType !== 'none') {
      rule = {
        type: repeatType,
        startDate: currentDate,
        ...(repeatType === 'every_x_days' ? { interval: everyXDays } : {}),
        ...(repeatType === 'custom_weekdays' ? { weekdays: customWeekdays } : {}),
      };
    }

    onAddTask(taskText, currentCategory.id, rule);
    setText('');
    setRepeatType('none');
    setShowOptions(false);

    // Safeguard to prevent accidental duplicate creation if user clicks ✓ and presses Enter rapidly
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 250);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleWeekday = (dayIndex: number) => {
    if (customWeekdays.includes(dayIndex)) {
      if (customWeekdays.length > 1) {
        setCustomWeekdays(customWeekdays.filter((d) => d !== dayIndex));
      }
    } else {
      setCustomWeekdays([...customWeekdays, dayIndex].sort());
    }
  };

  const dayOfWeek = parseDateString(currentDate).toLocaleDateString('en-US', { weekday: 'long' });
  const dayOfMonth = parseDateString(currentDate).getDate();

  return (
    <div className="w-full my-3">
      {/* 8.4 The Writing Line Input on Paper */}
      <div className="relative group">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          {/* Subtle Pencil/Plus Icon */}
          <div className="text-[#A59F92] pl-1">
            <Plus className="w-5 h-5 text-[#8E887E] transition-transform group-focus-within:rotate-90" />
          </div>

          {/* The Handwriting Line */}
          <div className="relative flex-1">
            <input
              id="task-writing-input"
              type="text"
              value={text}
              disabled={isOffline}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isOffline
                  ? "Offline mode (read-only)"
                  : "Write today's task... (press Enter to add)"
              }
              className={`w-full bg-transparent text-[#2D2B28] placeholder-[#9E978C] focus:outline-none py-2 px-1 border-b-2 transition-all ${fontClass} ${
                isOffline ? 'cursor-not-allowed opacity-60' : ''
              }`}
              style={{
                borderColor: text.trim() ? accentColor : '#DDD4C4',
              }}
            />
          </div>

          {/* Add Task Checkmark (✓) Action Button */}
          <button
            type="submit"
            id="btn-add-task-check"
            disabled={!text.trim() || isOffline}
            title={text.trim() ? "Add task (or press Enter)" : "Type a task to add"}
            className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center shrink-0 ${
              text.trim() && !isOffline
                ? 'cursor-pointer shadow-xs active:scale-95 text-white'
                : 'opacity-35 cursor-not-allowed border-[#DDD4C4] text-[#A59F92] bg-[#FAF6EE]'
            }`}
            style={
              text.trim() && !isOffline
                ? {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  }
                : {}
            }
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Category Trigger Pill */}
          <div className="relative">
            <button
              type="button"
              disabled={isOffline}
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-[#DDD4C4] bg-[#FFFDF9] hover:bg-[#F7F2E8] transition-colors text-[#5C554B]"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentCategory?.color || accentColor }}
              />
              <span className="hidden sm:inline">{currentCategory?.name || 'Category'}</span>
              <ChevronDown className="w-3 h-3 text-[#8E887E]" />
            </button>

            {/* Category Dropdown */}
            {showCategoryMenu && (
              <div className="absolute right-0 top-full mt-1.5 z-40 bg-[#FFFDF9] border border-[#E2DACB] rounded-xl shadow-md p-1 min-w-[130px] font-sans">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.id);
                      setShowCategoryMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#F5EFE3] text-left text-[#3D3A36]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    {selectedCategoryId === cat.id && <Check className="w-3 h-3 text-[#2D2B28]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Repeat Rule Toggle Icon Button */}
          <button
            type="button"
            disabled={isOffline}
            onClick={() => setShowOptions(!showOptions)}
            title="Configure repeating task"
            className={`p-1.5 rounded-full border transition-colors shrink-0 ${
              repeatType !== 'none'
                ? 'border-[#B6CBC1] text-[#2D4E41]'
                : 'border-[#DDD4C4] text-[#8E887E] hover:text-[#2D2B28]'
            }`}
            style={{
              backgroundColor: repeatType !== 'none' ? `${accentColor}18` : '#FFFDF9',
            }}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </form>

        {/* Repeat Rule Settings Dropdown Drawer */}
        {showOptions && (
          <div className="mt-2 p-3 rounded-xl bg-[#FAF6EE] border border-[#E4DC CD] text-xs font-sans text-[#4A453E] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2D2B28]">Repeat Rule:</span>
              <button
                type="button"
                onClick={() => {
                  setRepeatType('none');
                  setShowOptions(false);
                }}
                className="text-[#8E887E] hover:text-[#2D2B28]"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { type: 'none', label: 'Does not repeat' },
                { type: 'daily', label: 'Every day' },
                { type: 'weekly', label: `Weekly on ${dayOfWeek}` },
                { type: 'monthly', label: `Monthly on day ${dayOfMonth}` },
                { type: 'custom_weekdays', label: 'Custom weekdays' },
                { type: 'every_x_days', label: 'Every X days' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setRepeatType(item.type as RepeatType)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                    repeatType === item.type
                      ? 'border-[#8E887E] bg-white font-medium shadow-xs'
                      : 'border-[#E2DACB] hover:bg-white/60'
                  }`}
                  style={
                    repeatType === item.type
                      ? { borderColor: accentColor, color: '#2D2B28' }
                      : {}
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Custom weekdays selector */}
            {repeatType === 'custom_weekdays' && (
              <div className="pt-2 border-t border-[#E8DFD0] flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#787166] mr-1">Repeat on:</span>
                {WEEKDAY_NAMES.map((name, idx) => {
                  const isSelected = customWeekdays.includes(idx);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleWeekday(idx)}
                      className={`w-7 h-7 rounded-full text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'text-white'
                          : 'bg-white border border-[#DDD4C4] text-[#6B645A]'
                      }`}
                      style={isSelected ? { backgroundColor: accentColor } : {}}
                    >
                      {name[0]}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Every X days selector */}
            {repeatType === 'every_x_days' && (
              <div className="pt-2 border-t border-[#E8DFD0] flex items-center gap-2">
                <span className="text-[11px] text-[#787166]">Repeat every</span>
                <input
                  type="number"
                  min="2"
                  max="90"
                  value={everyXDays}
                  onChange={(e) => setEveryXDays(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-14 px-2 py-1 rounded border border-[#D5CCC0] bg-white text-center text-xs font-semibold"
                />
                <span className="text-[11px] text-[#787166]">days</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
