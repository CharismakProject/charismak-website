"use client";

import { useId } from "react";

type WorkDiagramProps = {
  type?: string | null;
  title: string;
  unit?: string;
};

const label = (value: string, x: number, y: number) => (
  <text x={x} y={y} fill="#DCE7F0" fontSize="10" fontWeight="700" letterSpacing="1.1">
    {value.toUpperCase()}
  </text>
);

export default function WorkDiagram({ type, title, unit }: WorkDiagramProps) {
  const gridId = useId().replaceAll(":", "");
  const finishGradientId = `${gridId}Finish`;
  const normalized = (type ?? "custom").toLowerCase();

  const drawing = (() => {
    if (normalized.includes("concrete")) return <>
      <path d="M95 238V80H365V238" fill="none" stroke="#F8FAFC" strokeWidth="4" />
      <rect x="120" y="72" width="220" height="44" rx="4" fill="#DCE7F0" stroke="#F8FAFC" strokeWidth="2" />
      <rect x="106" y="116" width="42" height="122" fill="#7890A4" stroke="#F8FAFC" strokeWidth="2" />
      <rect x="312" y="116" width="42" height="122" fill="#7890A4" stroke="#F8FAFC" strokeWidth="2" />
      <rect x="82" y="238" width="90" height="28" fill="#C8320A" /><rect x="288" y="238" width="90" height="28" fill="#C8320A" />
      {[128,334].map((x) => <g key={x}>{[135,166,197,228].map((y) => <line key={y} x1={x-12} y1={y} x2={x+12} y2={y} stroke="#E7B34B" strokeWidth="2" />)}</g>)}
      {label("beam", 205, 98)}{label("rc columns", 184, 210)}
    </>;
    if (normalized.includes("block")) return <>
      <rect x="98" y="82" width="250" height="126" fill="#DCE7F0" stroke="#F8FAFC" strokeWidth="2" />
      {[114, 146, 178].map((y) => <line key={y} x1="98" y1={y} x2="348" y2={y} stroke="#7890A4" />)}
      {[140, 182, 224, 266, 308].map((x, index) => <line key={x} x1={x} y1="82" x2={x} y2="208" stroke="#7890A4" strokeDasharray={index % 2 ? "32 32" : ""} />)}
      <line x1="78" y1="82" x2="78" y2="208" stroke="#E7B34B" /><path d="M72 82h12M72 208h12" stroke="#E7B34B" />
      {label("wall height", 62, 170)}
      <line x1="98" y1="228" x2="348" y2="228" stroke="#E7B34B" /><path d="M98 222v12M348 222v12" stroke="#E7B34B" />
      {label("wall length", 196, 246)}
    </>;
    if (normalized.includes("reinforcement")) return <>
      {[130, 210, 290].map((x) => <line key={x} x1={x} y1="60" x2={x} y2="230" stroke="#E7B34B" strokeWidth="7" />)}
      {[80, 115, 150, 185, 220].map((y) => <rect key={y} x="104" y={y} width="212" height="20" rx="8" fill="none" stroke="#F8FAFC" strokeWidth="3" />)}
      {label("main bars", 320, 78)}{label("links / stirrups", 320, 132)}
      <line x1="90" y1="250" x2="330" y2="250" stroke="#C8320A" strokeWidth="4" />
    </>;
    if (normalized.includes("excavation")) return <>
      <path d="M45 82H140L180 218H305L345 82H430" fill="#795E16" opacity=".55" stroke="#E7B34B" strokeWidth="2" />
      <path d="M180 218H305V245H180Z" fill="#C8320A" />
      <line x1="180" y1="260" x2="305" y2="260" stroke="#F8FAFC" /><path d="M180 254v12M305 254v12" stroke="#F8FAFC" />
      {label("trench width", 206, 277)}
      <line x1="160" y1="82" x2="160" y2="218" stroke="#F8FAFC" />{label("depth", 143, 160)}
    </>;
    if (normalized.includes("formwork")) return <>
      <path d="M105 82L245 45L360 95L220 136Z" fill="#C48A4A" stroke="#F8FAFC" strokeWidth="2" />
      <path d="M105 82V205L220 250V136Z" fill="#9B6737" stroke="#F8FAFC" strokeWidth="2" />
      <path d="M220 136V250L360 205V95Z" fill="#B97D42" stroke="#F8FAFC" strokeWidth="2" />
      {[130,180,230,280,330].map((x) => <line key={x} x1={x} y1="95" x2={x} y2="220" stroke="#E7B34B" strokeWidth="3" />)}
      {label("contact faces", 275, 238)}
    </>;
    if (normalized.includes("roof")) return <>
      <path d="M70 170L235 55L405 170" fill="none" stroke="#E7B34B" strokeWidth="12" />
      <path d="M100 170H375V245H100Z" fill="#DCE7F0" stroke="#F8FAFC" strokeWidth="2" />
      {[120,155,190,225,260,295,330,365].map((x) => <line key={x} x1={x} y1="155" x2={x+20} y2="105" stroke="#F8FAFC" strokeWidth="2" />)}
      {label("roof slope", 275, 90)}{label("eaves", 70, 190)}
    </>;
    if (normalized.includes("electrical")) return <>
      <rect x="75" y="55" width="320" height="190" fill="#DCE7F0" stroke="#F8FAFC" strokeWidth="2" />
      <path d="M115 75V130H225V198H340" fill="none" stroke="#E7B34B" strokeWidth="5" />
      <rect x="95" y="70" width="40" height="36" rx="4" fill="#0D3B66" stroke="#F8FAFC" />
      <rect x="320" y="178" width="42" height="40" rx="5" fill="#C8320A" stroke="#F8FAFC" />
      {label("distribution board", 145, 92)}{label("socket outlet", 292, 238)}
    </>;
    if (normalized.includes("mechanical") || normalized.includes("plumb") || normalized.includes("soil")) return <>
      <rect x="75" y="55" width="320" height="190" fill="#DCE7F0" stroke="#F8FAFC" strokeWidth="2" />
      <path d="M105 85V150H225V215H355" fill="none" stroke="#43C6D9" strokeWidth="11" />
      <circle cx="225" cy="150" r="12" fill="#071E33" stroke="#F8FAFC" strokeWidth="3" />
      <path d="M355 195h34v40h-34z" fill="#F8FAFC" stroke="#43C6D9" strokeWidth="3" />
      {label("pipe route", 128, 138)}{label("fittings", 238, 172)}
    </>;
    if (normalized.includes("finish") || normalized.includes("paint") || normalized.includes("til")) return <>
      <rect x="85" y="55" width="290" height="190" fill="#DCE7F0" stroke="#F8FAFC" strokeWidth="2" />
      <path d="M85 55H375V245H85Z" fill={`url(#${finishGradientId})`} opacity=".4" />
      {[110,155,200,245,290,335].map((x) => <line key={x} x1={x} y1="55" x2={x} y2="245" stroke="#7890A4" />)}
      {[95,135,175,215].map((y) => <line key={y} x1="85" y1={y} x2="375" y2={y} stroke="#7890A4" />)}
      <path d="M330 72q38 48 0 96" fill="none" stroke="#C8320A" strokeWidth="10" />
      {label("finish area", 190, 270)}
    </>;
    if (normalized.includes("fence")) return <>
      {[65,205,345].map((x) => <g key={x}><rect x={x} y="58" width="30" height="170" fill="#0D3B66" stroke="#F8FAFC" strokeWidth="2" /><rect x={x-12} y="228" width="54" height="25" fill="#C8320A" /></g>)}
      {[95,235].map((x) => <g key={x}><rect x={x} y="145" width="110" height="83" fill="#DCE7F0" stroke="#F8FAFC" /><rect x={x} y="90" width="110" height="55" fill="none" stroke="#E7B34B" strokeWidth="3" />{[x+18,x+42,x+66,x+90].map((bar) => <line key={bar} x1={bar} y1="92" x2={bar} y2="143" stroke="#E7B34B" strokeWidth="3" />)}</g>)}
    </>;
    return <>
      <path d="M85 210L205 75L360 115L310 245Z" fill="#0D3B66" stroke="#F8FAFC" strokeWidth="2" />
      <circle cx="205" cy="75" r="15" fill="#E7B34B" /><circle cx="360" cy="115" r="15" fill="#C8320A" />
      {label("custom measured work", 150, 270)}
    </>;
  })();

  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#0A3154] text-white shadow-[inset_0_0_60px_rgba(0,0,0,0.2)]">
      <svg viewBox="0 0 470 300" role="img" aria-label={`${title} construction diagram`} className="h-auto w-full">
        <defs>
          <pattern id={gridId} width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="rgba(255,255,255,.09)" /></pattern>
          <linearGradient id={finishGradientId}><stop stopColor="#E7B34B" /><stop offset="1" stopColor="#C8320A" /></linearGradient>
        </defs>
        <rect width="470" height="300" fill={`url(#${gridId})`} />
        {drawing}
        <rect x="18" y="16" width="250" height="28" rx="14" fill="rgba(7,30,51,.78)" />
        <text x="32" y="35" fill="#F8FAFC" fontSize="12" fontWeight="700">{title.toUpperCase()}</text>
        {unit ? <text x="430" y="35" textAnchor="end" fill="#E7B34B" fontSize="11" fontWeight="700">UNIT · {unit}</text> : null}
      </svg>
    </div>
  );
}
