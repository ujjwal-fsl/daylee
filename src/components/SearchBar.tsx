import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  accentColor: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  accentColor,
}) => {
  return (
    <div className="relative w-full mb-3">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-[#9E9688] pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search entire notebook..."
          className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-[#DDD4C4] bg-[#FFFDF9]/90 text-[#2D2B28] placeholder-[#9E978C] focus:outline-none focus:ring-1 focus:ring-[#8E887E] transition-all font-sans shadow-2xs"
          style={{
            borderColor: value ? accentColor : '#DDD4C4',
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2.5 p-1 rounded-full text-[#9E9688] hover:text-[#2D2B28]"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
