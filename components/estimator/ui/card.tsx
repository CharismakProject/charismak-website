type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-[32px] border border-[#d6dfe9] bg-white p-6 shadow-[0_18px_40px_rgba(11,41,66,0.08)] ${className}`}>
      {title ? <h3 className="text-lg font-semibold text-[#0B2942]">{title}</h3> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
