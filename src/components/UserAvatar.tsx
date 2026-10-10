import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface UserAvatarProps {
  user: User | null;
  size?: 'sm' | 'md';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if avatar URL changes
  useEffect(() => {
    setHasError(false);
  }, [user?.avatar]);

  const sizeClass = size === 'sm' ? 'w-6 h-6' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';
  const borderClass = size === 'sm' ? '' : 'border border-[#DDD4C4]';

  // Helper to extract clean initials (e.g. "US" for "Ujjwal Sharma" or "U" for "Ujjwal")
  const getInitials = (name?: string): string => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(user?.name);
  const avatarUrl = user?.avatar?.trim();

  if (avatarUrl && !hasError) {
    return (
      <img
        src={avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`${sizeClass} rounded-full object-cover ${borderClass} ${className} shrink-0`}
      />
    );
  }

  // Graceful fallback: user initials or neutral icon without broken image icon or clipped text
  return (
    <div
      className={`${sizeClass} rounded-full bg-[#EFE8DA] ${borderClass} flex items-center justify-center font-semibold text-[#5A5449] select-none ${textClass} ${className} shrink-0`}
      title={user?.name || 'User'}
    >
      {initials ? initials : <UserIcon className={`${iconSize} text-[#7A7367]`} />}
    </div>
  );
};
