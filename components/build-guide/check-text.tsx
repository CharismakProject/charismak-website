/** Shows guide text, turning "[CHECK …]" review notes into a small "to be confirmed" tag. */
export default function CheckText({ text }: { text: string }) {
  const parts = text.split(/(\[CHECK[^\]]*\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[CHECK/.test(part) ? (
          <span key={i} title={part.slice(1, -1)} className="ml-1 inline-block rounded-sm bg-[#FFF4D6] px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A5A00]">
            To be confirmed
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
