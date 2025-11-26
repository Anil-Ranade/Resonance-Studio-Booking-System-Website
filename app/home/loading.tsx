export default function HomeLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-[#0f0f1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}
