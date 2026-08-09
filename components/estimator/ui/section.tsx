type SectionPanelProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export default function SectionPanel({ title, children, className = "" }: SectionPanelProps) {
  return (
    <div className={`rounded-[28px] border border-[#d6dfe9] bg-[#F4F7FA] p-5 shadow-sm ${className}`}>
      <h4 className="text-base font-semibold text-[#0B2942]">{title}</h4>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}
