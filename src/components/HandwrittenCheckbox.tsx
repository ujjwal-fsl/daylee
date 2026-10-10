import React from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';

interface HandwrittenCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  accentColor?: string;
}

export const HandwrittenCheckbox: React.FC<HandwrittenCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  accentColor = '#A9472F',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    const nextState = !checked;
    onChange(nextState);

    // Trigger subtle paper confetti celebration when checking off a task (Section 8.6 & 17)
    if (nextState) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      try {
        confetti({
          particleCount: 24,
          spread: 45,
          startVelocity: 14,
          origin: { x, y },
          colors: ['#A9472F', '#E8BDB2', '#704331', '#D77F67', '#E8D9C5', '#FAF5EA'],
          disableForReducedMotion: true,
          ticks: 120,
          gravity: 0.8,
          scalar: 0.7,
          shapes: ['square', 'circle'],
        });
      } catch (err) {
        // Confetti fallback
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? 'Checked' : 'Not Checked'}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative flex items-center justify-center w-7 h-7 min-w-7 min-h-7 rounded-lg transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
      }`}
      style={{
        // @ts-ignore
        '--tw-ring-color': accentColor,
      }}
    >
      {/* Hand-drawn box outline */}
      <svg
        viewBox="0 0 28 28"
        className="w-6 h-6 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Slightly imperfect, organic hand-drawn square */}
        <motion.path
          d="M 5 6 C 11 4.8, 19 5.2, 23 5 C 24.2 11, 23.8 18, 23 23 C 17 23.8, 9 23.2, 5 23 C 4.2 17, 4.8 11, 5 6 Z"
          stroke={checked ? accentColor : '#8E887E'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            scale: checked ? 1.05 : 1,
          }}
          transition={{ duration: 0.15 }}
          className="transition-colors duration-200"
        />

        {/* Hand-drawn checkmark */}
        {checked && (
          <motion.path
            d="M 7 14 L 12 20 L 22 7"
            stroke={accentColor}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.22,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        )}
      </svg>
    </button>
  );
};
