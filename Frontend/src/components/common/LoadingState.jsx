export default function LoadingState({ message = "Loading data..." }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-zinc-300/80 bg-white py-16 animate-fade-enter">
      <div className="flex items-center gap-3 text-sm text-[#212529]/65">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#8338EC] border-t-transparent" />
        <span>{message}</span>
      </div>
    </div>
  );
}
