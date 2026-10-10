import React from 'react';
import { PaperStyle } from '../types';

interface NotebookBackgroundProps {
  paperStyle: PaperStyle;
  children: React.ReactNode;
}

export const NotebookBackground: React.FC<NotebookBackgroundProps> = ({
  paperStyle,
  children,
}) => {
  const paperClass =
    paperStyle === 'ruled'
      ? 'paper-ruled'
      : paperStyle === 'dotgrid'
      ? 'paper-dotgrid'
      : 'paper-plain';

  return (
    <div className="w-full max-w-[880px] mx-auto min-h-[calc(100vh-80px)] my-2 sm:my-6 transition-all duration-300">
      {/* Notebook outer shadow and soft rounded paper sheet */}
      <div
        className={`relative w-full rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06),0_1px_3px_rgb(0,0,0,0.04)] border border-[#EAE3D5] ${paperClass} overflow-hidden min-h-[750px] flex flex-col`}
      >
        {/* Top subtle spiral/header ribbon */}
        <div className="h-4 w-full bg-[#F5EFE3]/80 border-b border-[#EAE3D5] flex items-center justify-between px-6">
          <div className="flex gap-2 items-center opacity-40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E887E]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E887E]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E887E]"></span>
          </div>
          <span className="text-[10px] tracking-widest uppercase font-medium text-[#A09A8F]">
            Daylee Notebook
          </span>
          <div className="flex gap-2 items-center opacity-40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E887E]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E887E]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E887E]"></span>
          </div>
        </div>

        {/* Notebook page interior with left margin line */}
        <div className="relative flex-1 flex flex-col p-4 sm:p-8 md:p-10">
          {/* Subtle notebook vertical margin line (Japanese stationery style) */}
          <div className="absolute top-0 bottom-0 left-6 sm:left-14 md:left-16 w-[1.5px] bg-[#E8A5A5]/35 pointer-events-none hidden sm:block" />

          {/* Notebook content area */}
          <div className="relative z-10 flex-1 flex flex-col sm:pl-10 md:pl-12">
            {children}
          </div>
        </div>

        {/* Page bottom paper corner curl effect */}
        <div className="h-6 w-full flex items-center justify-between px-6 pb-2 text-[11px] text-[#A6A095] select-none">
          <span className="italic font-serif">A calmer way to plan.</span>
          <span className="opacity-70">page view</span>
        </div>
      </div>
    </div>
  );
};
