import { Sparkles } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <Sparkles className="w-16 h-16 text-pink-400 animate-pulse" />
          <div className="absolute inset-0 bg-pink-400/20 rounded-full blur-xl animate-pulse" />
        </div>
        <p className="text-white text-lg font-medium mt-6">{message}</p>
      </div>
    </div>
  );
}
