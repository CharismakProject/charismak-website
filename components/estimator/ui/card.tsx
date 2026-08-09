type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-[22px] border border-[#d6dfe9] bg-white p-4 shadow-[0_14px_32px_rgba(11,41,66,0.07)] sm:rounded-[32px] sm:p-6 sm:shadow-[0_18px_40px_rgba(11,41,66,0.08)] ${className}`}>
      {title ? <h3 className="text-lg font-semibold text-[#0B2942]">{title}</h3> : null}
      <div className="mt-3 min-w-0 sm:mt-4">{children}</div>
    </section>
  );
}
