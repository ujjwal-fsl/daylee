import React from 'react';
import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  isOffline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <div className="w-full bg-[#FAF0ED] border-b border-[#ECC4B8] text-[#8C3D2F] px-4 py-2 text-xs flex items-center justify-center gap-2 font-sans select-none sticky top-0 z-40">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>
        You're offline. Your notebook is available to read. Reconnect to make changes.
      </span>
    </div>
  );
};
