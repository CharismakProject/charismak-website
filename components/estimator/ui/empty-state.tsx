type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[32px] border border-dashed border-[#d6dfe9] bg-[#F8FAFC] p-8 text-[#0B2942] shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#0D3B66] text-white">✦</div>
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-[#556475]">{description}</p>
        </div>
      </div>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
