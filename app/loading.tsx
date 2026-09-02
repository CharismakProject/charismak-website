export default function Loading() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[255] h-[3px] overflow-hidden bg-[#F2B544]/20" role="status" aria-live="polite">
      <div className="h-full w-full animate-pulse bg-[#F2B544]" />
      <span className="sr-only">Opening page…</span>
    </div>
  );
}
