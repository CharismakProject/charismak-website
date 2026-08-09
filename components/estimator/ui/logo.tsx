export default function EstimatorLogo({ small }: { small?: boolean } = {}) {
  if (!small) {
    return (
      <div className="w-full rounded-2xl bg-white px-3 py-2">
        <img
          src="/branding/charismak-full-logo.png"
          alt="Charismak Project Nigeria Limited - Design, Cost & Build"
          width={420}
          height={210}
          className="h-auto w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0D3B66]">
        <img
          src="/branding/charismak-logo.png"
          alt="Charismak mark"
          width={24}
          height={24}
          className="object-contain filter brightness-0 invert"
        />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#071E33]">CHARISMAK</p>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#526579]">Construction Estimator</p>
      </div>
    </div>
  );
}
