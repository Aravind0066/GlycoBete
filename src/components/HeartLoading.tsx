import { Heart } from "lucide-react";

export function HeartLoading({ message = "GlycoBete is thinking..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur">
      <Heart className="animate-heartbeat text-red-500 fill-red-500" size={64} />
      <p className="mt-4 text-sm text-slate-400">{message}</p>
    </div>
  );
}
